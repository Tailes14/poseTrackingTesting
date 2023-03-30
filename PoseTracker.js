import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Dimensions, Button } from "react-native";

import {
  cameraWithTensors,
  bundleResourceIO,
} from "@tensorflow/tfjs-react-native";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";

import { Camera, CameraType } from "expo-camera";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import React, { useState, useEffect, useRef } from "react";
import Svg, { Circle, Line } from "react-native-svg";
import * as XLXS from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import ClassificationUtil from "./ClassificationUtil.js";

// forces all failed promises to be logged, instead of immediately crashing the app with no logs
global.Promise = require("promise");
require("promise/lib/rejection-tracking").enable({
  allRejections: true,
  onUnhandled: (id, error) => {
    console.log("unhandled rejection", id, error);
    console.log(error.stack);
  },
});

// screen settings for the camera preview to handle IOS and Android
const TensorCamera = cameraWithTensors(Camera);
const IS_ANDROID = Platform.OS === "android";
const IS_IOS = Platform.OS === "ios";
const CAM_PREVIEW_WIDTH = Dimensions.get("window").width;
const CAM_PREVIEW_HEIGHT = CAM_PREVIEW_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);
const OUTPUT_TENSOR_WIDTH = 180;
const OUTPUT_TENSOR_HEIGHT = OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

let frameCount = 0;

export default function PoseTracker({
  //Setting Default parameters for components

  //Inputs/Props from PoseTracker declaration
  exerciseType = "",
  showFps = true,
  renderKeypoints = true,
  estimationModelType = "full",
  cameraState = "front",
  classificationThreshold = 5,
  resetExercises = false,
  estimationSmoothing = true,
  autoRender = true,
  undefinedPoseName = "undefined_pose",
  undefinedExerciseName = "undefined_exercise",
  estimationThreshold = 0.5,
  classificationSmoothingValue = 1,
  movementWindowResetLimit = 20,

  //Outputs/Callbacks for PoseTracker declaration
  classifiedPose,
  classifiedPoses,
  classifiedExercise,
  classifiedExercises,
  learnedPoses,
  learnedExercises,
  isDetecting,
  isLoading,
}) {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const cameraRef = useRef(null);
  const [fps, setFps] = useState(0);
  const rafId = useRef(null);
  const [model, setModel] = useState();
  const [poses, setPoses] = useState();
  const [tfReady, setTfReady] = useState(false);
  const [classificationUtil, setClassificationUtil] = useState(null);

  useEffect(() => {
    classifiedPose([undefinedPoseName, 0.0]);
    //Returns:
    // --Array--
    // [pose_name, confidence value (negative or postive number)]
    // confidence value: more negative means less confident
    //  -this is a dynamic value which compares to other pose confidences

    var temp_object = [{ poseName: undefinedPoseName, confidence: 0.0 }];
    classifiedPoses(temp_object);
    //Returns:
    // --Object--

    // Example Pose Array of Objects
    // Array [
    //       Object {
    //         "confidence": 0.008087530732154846,
    //         "poseName": "t_pose",
    //       },
    //       Object {
    //         "confidence": -0.2243289351463318,
    //         "poseName": "tree",
    //       },
    //       Object {
    //         "confidence": -1.0932643413543701,
    //         "poseName": "warrior",
    //       },
    // ]
    // confidence value: more negative means less confident
    //  -this is a dynamic value which compares to other pose confidences

    classifiedExercise([undefinedExerciseName, 0]);
    //Returns:
    // --Array--
    // [exercise_name, rep count]

    classifiedExercises({ undefinedExerciseName: 0 });
    //Returns:
    //--Object--

    //Example Exercise Object Structure
    //Object {
    // "pushup": 0,
    // "tree-to-t":13
    // }

    learnedPoses([undefinedPoseName]);
    //Returns:
    // --Array--
    // [pose_name_1, pose_name_2]

    learnedExercises([undefinedExerciseName]);
    //Returns:
    // --Array--
    // [exercise_name_1, exercise_name_2]

    isDetecting(true);
    isLoading(true);
  }, []);

  useEffect(() => {
    async function prepare() {
      rafId.current = null;
      await Camera.requestCameraPermissionsAsync();
      await tf.ready();

      // creating model settings
      const modelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };

      // creating the model, using movenet
      const model = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        modelConfig
      );

      const classificationUtil_ = new ClassificationUtil();

      //model, label, and the associated hooks can be used to modify app (if needed)
      const [labels, learned_exercises] =
        await classificationUtil_.loadClassification(exerciseType);

      learnedPoses(labels); //sets learned poses for callback (output)
      learnedExercises(learned_exercises); //sets learned exercises for callback (output)
      classificationUtil_.setResetLimit(movementWindowResetLimit); //sets reset limit for exercise classification
      classificationUtil_.setSmoothingBuffer(classificationSmoothingValue); //sets smoothing buffer for exercise classification
      setClassificationUtil(classificationUtil_);

      setModel(model);
      setTfReady(true);
      console.log("tf ready and model set");
    }
    prepare();
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current != null && rafId.current !== 0) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    };
  }, []);

  const handleCameraStream = async (images, updatePreview, gl) => {
    console.log("entered handleCameraStream");
    const loop = async () => {
      const nextImageTensor = images.next().value;
      const startTs = Date.now();
      const poses = await model.estimatePoses(
        nextImageTensor,
        undefined,
        Date.now()
      );

      const latency = Date.now() - startTs;
      setFps(Math.floor(1000 / latency));
      setPoses(poses);

      if (poses) {
        isLoading(false);
      }
      /*
      if (poses.length > 0) {
        var [poseName, confidence] = await classificationUtil.classifyPose(
          poses
        );

        console.log("Pose Name: ", poseName, " Confidence: ", confidence);

        if (poseName && confidence && confidence > 0.7) {
          classifiedPose([poseName, confidence]);
          //console.log("Pose Name: ", poseName, " Confidence: ", confidence);
          isDetecting(false);

          if (!resetExercises) {
            //classificationUtil.trackMovement();
          }
        }
      } else {
        //console.log("pose confidence not high enough");
        classifiedPose([undefinedPoseName, 0.0]);
        isDetecting(true);
      }
      */

      try {
        if (poses.length > 0) {
          var [poseName, confidence] = await classificationUtil.classifyPose(
            poses
          );
          var classified_poses = await classificationUtil.classifyPoses(poses);
          if (poseName && confidence && confidence > 0.7) {
            classifiedPose([poseName, confidence]);
            classifiedPoses(classified_poses);
            //console.log(classified_poses);
            isDetecting(false);

            if (!resetExercises) {
              classificationUtil.trackMovement();
              classificationUtil.classifyExercise();
              const detectedExercise =
                classificationUtil.getClassifiedExercise();
              const detectedExercises =
                classificationUtil.getClassifiedExercises();
              if (detectedExercise) {
                classifiedExercise(detectedExercise);
                classifiedExercises(detectedExercises);
                //console.log(detectedExercise);
              } else {
                classifiedExercise([undefinedExerciseName, 0]);
                classifiedExercises(detectedExercises);
              }
              //isDetecting(true);
            }
          }
        }
      } catch (error) {
        console.log("error caught somewhere inside " + error);
      }

      /*
      // 1
      try {
        //1.1
        if (poses.length > 0) {
          //1.2
          // for single pose
          try {
            var [poseName, confidence] = await classificationUtil.classifyPose(
              poses
            );
          } catch {
            var [poseName, confidence] = [undefinedPoseName, 0.0];
            console.log("error on try catch 1.2");
          }
          //1.3
          // for complete activity
          try {
            var classified_poses = await classificationUtil.classifyPoses(
              poses
            );
          } catch {
            var tempObject = [{ poseName: undefinedPoseName, confidence: 0.0 }];
            classifiedPoses(tempObject);
            console.log("error on try catch 1.3");
          }
          // 2
          if (poseName && confidence && confidence > 0.7) {
            console.log("2");
            classifiedPose([poseName, confidence]);
            classifiedPoses(classified_poses);
            isDetecting(false);
            // 3
            if (!resetExercises) {
              console.log("3");
              classificationUtil.trackMovement();
              classificationUtil.classifyExercise();
              const detectedExercise = classificationUtil.getDetectedExercise();
              // 4
              if (detectedExercise) {
                classifiedExercise(detectedExercise);
                classifiedExercises(classificationUtil.getDetectedExercises());
              } else {
                console.log("exercise not detected");
                classificationUtil.resetExercises();
              }
              // 5
              try {
                classificationUtil.trackUndefinedMovement();
              } catch {
                console.log("error on try catch 5");
              }
            }
          }
        }
      } catch {
        console.log("error on try catch 1");
      }
      */
      /*
      try {
        if (poses.length > 0) {
          try {
            var [poseName, confidence] = await classificationUtil.classifiyPose(
              poses
            );
            console.log("posename :" + poseName);
          } catch {
            var [poseName, confidence] = [undefinedPoseName, 0.0];
            //console.log("No pose detected");
          }
          try {
            var classified_poses = await classificationUtil.classifyPoses(
              poses
            );
          } catch {
            var temp_object = [
              { poseName: undefinedPoseName, confidence: 0.0 },
            ];
            classifiedPoses(temp_object);
          }
          if (poseName && confidence && confidence > classificationThreshold) {
            classifiedPose([poseName, confidence]);
            classifiedPoses(classified_poses);
            isDetecting(false);
            if (!resetExercises) {
              classificationUtil.trackMovement();
              classificationUtil.classifyExercise();
              const detectedExercise = classificationUtil.getDetectedExercise();
              if (detectedExercise) {
                classifiedExercise(detectedExercise);
                classifiedExercises(classificationUtil.getDetectedExercises());
              } else {
                classificationUtil.resetExercises();
              }
            } else {
              if (resetExercises) {
                classificationUtil.resetExercises();
              }
              try {
                classificationUtil.trackUndefinedMovement();
              } catch {}
            }
          }
        }
      } catch {}
      */
      tf.dispose([nextImageTensor]);

      if (rafId.current === 0) {
        return;
      }

      //updatePreview();
      //gl.endFrameEXP();

      rafId.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const renderPose = () => {
    if (poses != null && poses.length > 0) {
      const keypoints = poses[0].keypoints
        .filter((k) => (k.score ?? 0) > 0.5)
        .map((k) => {
          // console.log(k);
          const flipX = IS_ANDROID || type === Camera.Constants.Type.back;
          const x = flipX ? getOutputTensorWidth() - k.x : k.x;
          const y = k.y;
          const cx = (x / getOutputTensorWidth()) * CAM_PREVIEW_WIDTH;
          const cy = (y / getOutputTensorHeight()) * CAM_PREVIEW_HEIGHT;

          //console.log(k);

          return (
            <Circle
              key={k.name}
              cx={cx}
              cy={cy}
              r="4"
              strokeWidth="2"
              fill="#00AA00"
              stroke="white"
            ></Circle>
          );
        });

      // Draw lines between connected keypoints.
      const skeleton = poseDetection.util
        .getAdjacentPairs(poseDetection.SupportedModels.MoveNet)
        .map(([i, j], index) => {
          const keypoints = poses[0].keypoints.filter(
            (k) => (k.score ?? 0) > 0.5
          );
          try {
            const kp1 = keypoints[i];
            const kp2 = keypoints[j];
            const x1 = kp1.x;
            const y1 = kp1.y;
            const x2 = kp2.x;
            const y2 = kp2.y;

            //console.log(keypoints);

            const cx1 = (x1 / getOutputTensorWidth()) * CAM_PREVIEW_WIDTH;
            const cy1 = (y1 / getOutputTensorHeight()) * CAM_PREVIEW_HEIGHT;
            const cx2 = (x2 / getOutputTensorWidth()) * CAM_PREVIEW_WIDTH;
            const cy2 = (y2 / getOutputTensorHeight()) * CAM_PREVIEW_HEIGHT;
            return (
              <Line
                key={`skeletonls_${index}`}
                x1={cx1}
                y1={cy1}
                x2={cx2}
                y2={cy2}
                r="4"
                stroke="red"
                strokeWidth="1"
              ></Line>
            );
          } catch {
            //console.log("point not needed to be drawn");
          }
        });
      return (
        <Svg style={styles.svg}>
          {/*skeleton*/}
          {keypoints}
        </Svg>
      );
    } else {
      return <View></View>;
    }
  };

  const renderPoseName = () => {
    if (poseName) {
      return (
        <View>
          <Text style={styles.poseName}>{poseName}</Text>
        </View>
      );
    } else {
      return <View></View>;
    }
  };

  const renderFrameCount = () => {
    return (
      <View style={styles.fpsContainer}>
        <Text>Frame #: {frameCount}</Text>
      </View>
    );
  };

  const getOutputTensorWidth = () => {
    return OUTPUT_TENSOR_WIDTH;
  };

  const getOutputTensorHeight = () => {
    return OUTPUT_TENSOR_HEIGHT;
  };

  if (!tfReady) {
    return (
      <View style={styles.loadingMsg}>
        <Text>Loading...</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <TensorCamera
          ref={cameraRef}
          style={styles.cameraPreview}
          type={type}
          autorender={true}
          resizeWidth={getOutputTensorWidth()}
          resizeHeight={getOutputTensorHeight()}
          resizeDepth={3}
          onReady={handleCameraStream}
        />
        {renderPose()}
        {/*renderFps()*/}
        {/*renderFrameCount()*/}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: CAM_PREVIEW_WIDTH,
    height: CAM_PREVIEW_HEIGHT,
    marginTop: Dimensions.get("window").height - CAM_PREVIEW_HEIGHT,
  },
  cameraPreview: {
    height: "100%",
    width: "100%",
    zIndex: 1,
  },
  fpsContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 80,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, .7)",
    borderRadius: 2,
    padding: 8,
    zIndex: 20,
  },
  loadingMsg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 30,
  },
});

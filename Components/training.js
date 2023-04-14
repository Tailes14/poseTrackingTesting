import { StyleSheet, Text, View, Dimensions, Button } from "react-native";
import "@tensorflow/tfjs-react-native";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { Camera } from "expo-camera";
import React, { useState, useEffect, useRef } from "react";
import Svg, { Circle, Line } from "react-native-svg";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import possiblePoses from "../assets/classes.json";

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

// variables to hold the frame count for exporting
let frameData = new Array();
let frameCount = 0;

// variable that holds the possible pose options that can be trained
// to add more poses, add to the classes.json file, the app will automatically change the select button to include it
let poseOptions = [];
possiblePoses.forEach((pose, index) => {
  poseOptions.push({ value: index, label: pose });
});

export default function Training() {
  const [type, setType] = useState(Camera.Constants.Type.front);
  const cameraRef = useRef(null);
  const [fps, setFps] = useState(0);
  const rafId = useRef(null);
  const [model, setModel] = useState();
  const [poses, setPoses] = useState();
  const [tfReady, setTfReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [poseOption, setPoseOption] = useState(poseOptions[0]);

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
      if (recording == true) {
        let keypoints = poses[0].keypoints;
        keypoints.push(poseOption.value);
        frameData.push(keypoints);
        // used to display # of frames recorded if wanted
        frameCount++;
      }
      const keypoints = poses[0].keypoints
        .filter((k) => (k.score ?? 0) > 0.5)
        .map((k) => {
          // console.log(k);
          const flipX = IS_ANDROID || type === Camera.Constants.Type.back;
          const x = flipX ? getOutputTensorWidth() - k.x : k.x;
          const y = k.y;
          const cx = (x / getOutputTensorWidth()) * CAM_PREVIEW_WIDTH;
          const cy = (y / getOutputTensorHeight()) * CAM_PREVIEW_HEIGHT;
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
          } catch {}
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

  // displays fps if wanted
  const renderFps = () => {
    return (
      <View style={styles.fpsContainer}>
        <Text>FPS: {fps}</Text>
      </View>
    );
  };

  // displays frame count if wanted, used for debugging mainly
  const renderFrameCount = () => {
    return (
      <View style={styles.fpsContainer}>
        <Text>Frame #: {frameCount}</Text>
      </View>
    );
  };

  // generates the output file with keypoints and pose option
  const generateJSON = () => {
    setRecording(false);

    let i = frameData.length;

    // fixes duplicate frame bug
    while (i--) (i + 1) % 2 === 0 && frameData.splice(i, 1);

    const filename = FileSystem.documentDirectory + "JointData.json";
    FileSystem.writeAsStringAsync(filename, JSON.stringify(frameData)).then(
      () => {
        Sharing.shareAsync(filename);
      }
    );

    // reseting saved data so that the app doesnt need reloaded to record another pose
    frameData = [];
    frameCount = 0;
  };

  const getOutputTensorWidth = () => {
    return OUTPUT_TENSOR_WIDTH;
  };

  const getOutputTensorHeight = () => {
    return OUTPUT_TENSOR_HEIGHT;
  };

  const cyclePoseOptions = () => {
    if (poseOption.value < poseOptions.length - 1) {
      setPoseOption(poseOptions[poseOption.value + 1]);
    } else {
      setPoseOption(poseOptions[0]);
    }
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
        {<Button title={poseOption.label} onPress={cyclePoseOptions}></Button>}
        {recording ? (
          <Button title="Stop Tracking & Create JSON" onPress={generateJSON} />
        ) : (
          <Button
            title="Start Tracking Points"
            onPress={() => setRecording(true)}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: CAM_PREVIEW_WIDTH,
    height: CAM_PREVIEW_HEIGHT,
    marginTop: Dimensions.get("window").height / 2 - CAM_PREVIEW_HEIGHT / 2,
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

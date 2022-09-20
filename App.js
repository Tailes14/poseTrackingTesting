import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Dimensions } from "react-native";
import "@tensorflow/tfjs-react-native";
import {
  cameraWithTensors,
  bundleResourceIO,
} from "@tensorflow/tfjs-react-native";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import { Camera, CameraType } from "expo-camera";
import { GLView, ExpoWebGLRenderingContext } from "expo-gl";
import React, { useState, useEffect, useRef } from "react";
import Svg, { Circle } from "react-native-svg";

global.Promise = require("promise");

require("promise/lib/rejection-tracking").enable({
  allRejections: true,
  onUnhandled: (id, error) => {
    console.log("unhandled rejection", id, error);
    console.log(error.stack);
  },
});

const TensorCamera = cameraWithTensors(Camera);
const IS_ANDROID = Platform.OS === "android";
const IS_IOS = Platform.OS === "ios";

const CAM_PREVIEW_WIDTH = Dimensions.get("window").width;
const CAM_PREVIEW_HEIGHT = CAM_PREVIEW_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

const OUTPUT_TENSOR_WIDTH = 180;
const OUTPUT_TENSOR_HEIGHT = OUTPUT_TENSOR_WIDTH / (IS_IOS ? 9 / 16 : 3 / 4);

export default function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.front);
  const cameraRef = useRef(null);
  const [fps, setFps] = useState(0);
  const rafId = useRef(null);
  const [model, setModel] = useState();
  const [poses, setPoses] = useState();
  const [tfReady, setTfReady] = useState(false);

  /*
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");
    })();
  }, []);
  */

  useEffect(() => {
    async function prepare() {
      rafId.current = null;
      await Camera.requestCameraPermissionsAsync();
      await tf.ready();

      const modelConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      };

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
      try {
        console.log(poses[0].keypoints);
      } catch {}
      const latency = Date.now() - startTs;
      setFps(Math.floor(1000 / latency));
      setPoses(poses);
      tf.dispose([nextImageTensor]);

      if (rafId.current === 0) {
        return;
      }

      updatePreview();
      gl.endFrameEXP();

      rafId.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const renderPose = () => {
    if (poses != null && poses.length > 0) {
      const keypoints = poses[0].keypoints
        .filter((k) => (k.score ?? 0) > 0.5)
        .map((k) => {
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
      return <Svg style={styles.svg}>{keypoints}</Svg>;
    } else {
      return <View></View>;
    }
  };

  const renderFps = () => {
    return (
      <View style={styles.fpsContainer}>
        <Text>FPS: {fps}</Text>
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
          autorender={false}
          resizeWidth={getOutputTensorWidth()}
          resizeHeight={getOutputTensorHeight()}
          resizeDepth={3}
          onReady={handleCameraStream}
        />
        {renderPose()}
        {renderFps()}
      </View>
    );
  }
}
/*

class PoseDetector extends React.Component {
  handleCameraStream(images, updatePreview, gl) {
    const loop = async () => {
      const nextImageTensor = images.next().value;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableTracking: true,
      };
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );

      const poses = await detector.estimatePoses(nextImageTensor);
      console.log(poses);
    };
    loop();
  }
  render() {
    let textureDims;
    if (Platform.OS === "ios") {
      textureDims = {
        height: 1920,
        width: 1080,
      };
    } else {
      textureDims = {
        height: 1200,
        width: 1600,
      };
    }

    return (
      <View>
        <TensorCamera
          style={styles.camera}
          type={CameraType.back}
          cameraTextureHeight={textureDims.height}
          cameraTextureWidth={textureDims.width}
          resizeHeight={200}
          resizeWidth={152}
          resizeDepth={3}
          onready={this.handleCameraStream}
          autorender={true}
        />
      </View>
    );
  }
}

export default class App extends React.Component {

  render() {
    return (
      <View style={styles.container}>
        <Camera styles={styles.camera}></Camera>
      </View>
    );
  }
}
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  cameraPreview: {
    flex: 1,
    borderRadius: 20,
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

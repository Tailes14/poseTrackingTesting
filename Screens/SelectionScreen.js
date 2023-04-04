import { abs } from "@tensorflow/tfjs-core";
import * as React from "react";
import { RadioButton } from "react-native-paper";
import {
  StyleSheet,
  Button,
  View,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import { Animated } from "react-native";
import App from "../temp(training)";
import { useNavigation } from "@react-navigation/native";
import PoseTracker from "../PoseTracker";

export default function FirstScreen() {
  // styling; hover and fading attributes
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const radioButtonOpacity = React.useRef(new Animated.Value(0)).current;
  const radioButtonOpacity2 = React.useRef(new Animated.Value(0)).current;

  const [isHoveredTest, setIsHoveredTest] = React.useState(false);
  const [isHoveredTrain, setIsHoveredTrain] = React.useState(false);
  const [isHoveredJumpingJacks, setHoveredJumpingJacks] = React.useState(false);
  const [isHoveredSquats, setHoveredSquats] = React.useState(false);
  // styling; hover and fading attributes
  const navigation = useNavigation(); //used to switch screens
  const [showButtons, setShowButtons] = React.useState(false); //this shows actions
  const [showSubActionsJJ, setSubActionsJJ] = React.useState(false); //sub actions for Jumping jacks
  const [showSubActionsSQ, setSubActionsSQ] = React.useState(false); //sub actions for Squats
  const [showGoButton, setGoButton] = React.useState(false);
  const [selectedButton, setSelectedButton] = React.useState(""); //set if either Train or Test
  const [selectedActionButton, setSelectedActionButton] = React.useState("");
  const [selectedPoseButton, setSelectedPoseButton] = React.useState(""); // poses for JJ or Squat

  const goTest = () => {
    if (
      (selectedPoseButton === "JJ Top" || selectedPoseButton === "JJ Bottom") &&
      selectedActionButton === "Jumping Jacks"
    ) {
      navigation.navigate("JumpingJacks", {
        targetPose: selectedPoseButton,
        targetExercise: selectedActionButton,
      });
    } else if (
      (selectedPoseButton === "Squat Top" ||
        selectedPoseButton === "Squat Bottom") &&
      selectedActionButton === "Squats"
    ) {
      navigation.navigate("Squats", {
        targetPose: selectedPoseButton,
        targetExercise: selectedActionButton,
      });
    } else if (
      selectedPoseButton === "JJCOUNTPOSE" &&
      selectedActionButton === "Jumping Jacks"
    ) {
      navigation.navigate("CounterJJ");
    } else if (
      selectedPoseButton === "SQCOUNTPOSE" &&
      selectedActionButton === "Squats"
    ) {
      navigation.navigate("CounterSQ");
    }
  };
  const trainData = () => {
    navigation.navigate("Training");
  };

  const setSelectedButtons = (buttonname) => {
    setSelectedButton("");
    setSelectedButton(buttonname);
    showActionSelection();
  };
  const showActionSelection = () => {
    setShowButtons(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200, // Change the duration to adjust the animation speed
      useNativeDriver: true,
    }).start();
  };

  function clearButtons() {
    setShowButtons(false);
    setSubActionsJJ(false);
    setSubActionsSQ(false);
    setGoButton(false);
    setSelectedPoseButton("");

    Animated.timing(radioButtonOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(radioButtonOpacity2, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  const showSubActionSelectionJJ = (buttonName) => {
    if (showSubActionsSQ == true) {
      setSubActionsSQ(false);
      Animated.timing(radioButtonOpacity2, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setSelectedActionButton("");
    }
    setSubActionsJJ(true);
    Animated.timing(radioButtonOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setSelectedActionButton("Jumping Jacks");
  };

  const showSubActionSelectionSQ = (buttonName) => {
    if (showSubActionsJJ == true) {
      setSubActionsJJ(false);
      Animated.timing(radioButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setSelectedActionButton("");
    }
    setSubActionsSQ(true);
    Animated.timing(radioButtonOpacity2, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setSelectedActionButton("Squats");
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.selection_option_text, styles.test_train_position]}>
        Test/Train Selection
      </Text>
      <TouchableOpacity
        style={[
          styles.button_attributes,
          isHoveredTrain && styles.buttonHover,
          styles.trainbuttonPosition,
        ]}
        onPressIn={() => setIsHoveredTrain(true)} //if set true, set color to buttonHover color
        onPressOut={() => setIsHoveredTrain(false)}
        onPress={() => trainData()}
      >
        <Text style={styles.buttonText}>Record</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text style={styles.clear_button} onPress={clearButtons}>
          Clear
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button_attributes,
          isHoveredTest && styles.buttonHover,
          styles.testbuttonPosition,
        ]}
        onPressIn={() => setIsHoveredTest(true)}
        onPressOut={() => setIsHoveredTest(false)}
        onPress={() => setSelectedButtons("Test")}
      >
        <Text style={styles.buttonText}>Test</Text>
      </TouchableOpacity>

      <Animated.View style={{ opacity: fadeAnim }}>
        {showButtons && ( //action selection (Jumping Jacks or Squats)  fields upon clicking test or train button
          <View>
            <Text
              style={[styles.selection_option_text, styles.action_position]}
            >
              Action Selection
            </Text>
            <TouchableOpacity
              style={[
                styles.button_attributes,
                isHoveredJumpingJacks && styles.buttonHover,
                styles.jjbutton_pos,
              ]}
              onPressIn={() => setHoveredJumpingJacks(true)}
              onPressOut={() => setHoveredJumpingJacks(false)}
              onPress={showSubActionSelectionJJ}
            >
              <Text style={[styles.buttonText]}>Jumping Jacks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button_attributes,
                isHoveredSquats && styles.buttonHover,
                styles.squatsbuttonpos,
              ]}
              onPressIn={() => setHoveredSquats(true)}
              onPressOut={() => setHoveredSquats(false)}
              onPress={showSubActionSelectionSQ}
            >
              <Text style={styles.buttonText}>Squats</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {showSubActionsJJ && ( //sub action selection fields for jumping jacks
        <View style={[styles.radiobutton_jjpos]}>
          <Text
            style={[
              styles.selection_option_text,
              styles.poseselection_position,
            ]}
          >
            Pose Selection
          </Text>
          <Animated.View style={{ opacity: radioButtonOpacity }}>
            <RadioButton.Group
              onValueChange={(value) => setSelectedPoseButton(value)}
            >
              <View style={styles.radio_button_container}>
                <View style={styles.radio_line} />
                <RadioButton.Item
                  label="Jumping Jack Top"
                  value="JJ Top"
                  labelStyle={styles.radio_style}
                />
                <RadioButton.Item
                  label="Jumping Jack Bottom"
                  value="JJ Bottom"
                  labelStyle={styles.radio_style}
                />
                <RadioButton.Item
                  label="Count Jumping Jack Pose"
                  value="JJCOUNTPOSE"
                  labelStyle={styles.radio_style}
                />
                <View style={styles.radio_line} />
              </View>
            </RadioButton.Group>
          </Animated.View>
        </View>
      )}

      {showSubActionsSQ && ( //sub action selection fields for Squats
        <View style={styles.radiobutton_jjpos}>
          <Text
            style={[
              styles.selection_option_text,
              styles.poseselection_position,
            ]}
          >
            Pose Selection
          </Text>
          <Animated.View style={{ opacity: radioButtonOpacity2 }}>
            <RadioButton.Group
              onValueChange={(value) => setSelectedPoseButton(value)}
            >
              <View style={styles.radio_button_container}>
                <View style={styles.radio_line} />
                <RadioButton.Item
                  label="Squat Top"
                  value="Squat Top"
                  labelStyle={styles.radio_style}
                />
                <RadioButton.Item
                  label="Squat Bottom"
                  value="Squat Bottom"
                  labelStyle={styles.radio_style}
                />
                <RadioButton.Item
                  label="Count Squat Pose"
                  value="SQCOUNTPOSE"
                  labelStyle={styles.radio_style}
                />
                <View style={styles.radio_line} />
              </View>
            </RadioButton.Group>
          </Animated.View>
        </View>
      )}

      {selectedPoseButton !== "" && ( //Go Button
        <View>
          <TouchableOpacity
            style={[styles.button_attributes, styles.go_button_pos]}
            onPress={() => goTest()}
          >
            <Text style={[styles.buttonText]}>
              {selectedButton +
                " " +
                selectedActionButton +
                " " +
                " " +
                selectedPoseButton}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#122443",
  },
  button_attributes: {
    backgroundColor: "#3c5ea4",
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 65,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: "absolute",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 1,
    textAlign: "center",
  },
  buttonHover: {
    backgroundColor: "#4f73ff",
  },
  testbuttonPosition: {
    top: 110,
    right: 250,
  },
  trainbuttonPosition: {
    top: 110,
    right: 10,
  },
  selection_option_text: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    textAlign: "center",
    color: "white",
  },
  test_train_position: {
    top: 70,
    right: 80,
  },

  action_position: {
    top: 200,
    right: 95,
  },
  clear_button: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#FF0000",
    top: 50,
    textAlign: "right",
    right: 30,
    position: "fixed",
    zindex: 3,
  },
  jjbutton_pos: {
    top: 240,
    align: "left",
    left: 10,
    borderRadius: 50,
    paddingVertical: 21,
    paddingHorizontal: 27,
  },
  squatsbuttonpos: {
    top: 240,
    left: 230,
  },
  radiobutton_jjpos: {
    top: 340,
  },
  poseselection_position: {
    right: 100,
  },
  radio_style: {
    color: "white",
    fontSize: 16,
    fontWeight: "200",
    letterSpacing: 1,
    textAlign: "left",
    position: "fixed",
  },
  radio_line: {
    borderBottomWidth: 1,
    borderColor: "white",
    width: 412,
    marginLeft: 10,
    marginRight: 10,
  },
  radio_button_container: {
    top: 20,
  },

  go_button_pos: {
    top: 400,
    backgroundColor: "#113803",
    alignSelf: "center",
    justifyContent: "center",
    flex: 1,
  },
});

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator,
  Platform,
} from "react-native";
import StackNavigation from "./Screens/StackNavigation";
const IS_ANDROID = Platform.OS === "android";
const IS_IOS = Platform.OS === "ios";

const PREVIEW_MARGIN = IS_IOS ? -250 : -200;

export default function MainMenu() {
  return <StackNavigation />;
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    height: 100,
    justifyContent: "space-between",
    alignContent: "center",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
  },
  orangebox: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#e89631",
    borderWidth: 2,
    borderRadius: 9,
    justifyContent: "center",
    alignContent: "center",
  },
  purplebox: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#af5dc2",
    borderWidth: 2,
    borderRadius: 9,
    justifyContent: "center",
    alignContent: "center",
  },
  greenbox: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#58a34d",
    borderWidth: 2,
    borderRadius: 9,
    justifyContent: "center",
    alignContent: "center",
  },
  targetname: {
    flex: 1,
    flexDirection: "row",
    top: 15,
    justifyContent: "center",
  },
  button: {
    position: "relative",
    width: "100%",
  },
  loading: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 100,
    zIndex: 200,
  },
  tracker: {
    position: "absolute",
    left: 0,
    top: PREVIEW_MARGIN,
    zIndex: 100,
  },
  container: {
    flex: 1,
    justifyContent: "center",
  },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 80,
  },
});

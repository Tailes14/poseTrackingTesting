import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import FirstScreen from "./SelectionScreen";
import App from "../temp(training)";
import JumpingJackScreen from "./JumpingJackScreen";
import SquatScreen from "./SquatScreen";
import CountJumpingJack from "./CountJumpingJack";
import CountSquat from "./CountSquat";

const Stack = createStackNavigator();

const StackNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            //width: "100%",
            //aspectRatio: 1,
            backgroundColor: "#3c5ea4",
          },
          headerTintColor: "white",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 22,
            right: 100,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={FirstScreen}
          options={{ title: "Pose Tracker" }}
        />
        <Stack.Screen
          name="Training"
          component={App}
          options={{
            headerStyle: {
              backgroundColor: "#3c5ea4",
              height: 0,
            },
            headerTintColor: "white",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 22,
            },
            headerTitle: "Training Screen",
          }}
        />
        <Stack.Screen
          name="JumpingJacks"
          component={JumpingJackScreen}
          options={{}}
        />
        <Stack.Screen name="Squats" component={SquatScreen} options={{}} />
        <Stack.Screen
          name="CounterJJ"
          component={CountJumpingJack}
          options={{}}
        />
        <Stack.Screen name="CounterSQ" component={CountSquat} options={{}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigation;

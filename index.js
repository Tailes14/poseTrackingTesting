import "react-native-gesture-handler";
import { registerRootComponent } from "expo";

import MainMenu from "./MainMenu";
import PoseDectector from "./temp(training)";
import Training from "./Components/training";
import detect from "./temp(App)";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(MainMenu);

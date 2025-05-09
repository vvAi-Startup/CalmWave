import React from "react";
import { useFonts } from "expo-font";
import { createStackNavigator } from "@react-navigation/stack";
import { NavProvider } from "@/context/navContext";
import RecordScreen from "../screens/Record";
import AudioListScreen from "../screens/AudioScreen";
import LoginScreen from "../screens/Login";

const Stack = createStackNavigator();

export default function Index() {
  const [fontsLoaded] = useFonts({
    "BigShoulders-Regular": require("../assets/fonts/BigShoulders-Regular.ttf"),
    "Azonix": require("../assets/fonts/Azonix.otf"),
  });

   if (!fontsLoaded) {
     return null;
   }

  return (
    <NavProvider>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      > 
        <Stack.Screen name="Login" component={LoginScreen} /> 
        <Stack.Screen name="AudioList" component={AudioListScreen} />
        <Stack.Screen name="Record" component={RecordScreen} />
        {/* <Stack.Screen name="Config" component={ConfigScreen} /> */}
      </Stack.Navigator>
    </NavProvider>
  );
}

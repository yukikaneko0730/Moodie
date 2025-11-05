// app/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { Nunito_700Bold } from "@expo-google-fonts/nunito";
import { View, ActivityIndicator, Text } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F6" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: "#666", fontFamily: "Poppins_400Regular" }}>Loading fonts…</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F6F6F6" },
      }}
    />
  );
}

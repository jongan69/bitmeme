import Tabs from "@/components/ui/Tabs";
// import { useWalletOnboarding } from "@/hooks/useWallets";
import { Provider as TinyBaseProvider } from "tinybase/ui-react";
import MemeStore from "@/stores/Memestore";
import { useNetworkState } from "expo-network";
import { SignedIn, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function Layout() {
  // const { solanaAddress, bitcoinAddress } = useWalletOnboarding();
  // console.log("Layout solanaAddress", solanaAddress);
  // console.log("Layout bitcoinAddress", bitcoinAddress);
  // Keep the splash screen visible while we fetch resources
  const { user } = useUser();
  const networkState = useNetworkState();

  useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <SignedIn>
      <TinyBaseProvider>
        <MemeStore />
        <Tabs>
          <Tabs.Screen
            name="(index)"
            systemImage="house.fill"
            title="Home"
          />
          <Tabs.Screen
            name="meme"
            systemImage="heart.fill"
            title="Meme"
          />
          <Tabs.Screen
            name="(settings)"
            systemImage="gearshape.fill"
            title="Settings"
          />
        </Tabs>
      </TinyBaseProvider>
    </SignedIn>
  );
}
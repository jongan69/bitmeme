import { Suspense, useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";
import { Slot, SplashScreen } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as RNThemeProvider,
  Theme,
} from "@react-navigation/native";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast, { BaseToast } from 'react-native-toast-message';

// Components
import { AsyncFont } from "@/components/data/async-font";
import { tokenCache } from "@/stores/local/cache";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";

// Contexts
import { UnifiedWalletProvider } from "@/contexts/UnifiedWalletProvider";
import { ZplClientProvider } from '@/contexts/ZplClientProvider';
import ThemeProvider from "@/components/ui/ThemeProvider";
// import { StripeProvider } from '@stripe/stripe-react-native';

import { SourceCodePro_400Regular } from "@expo-google-fonts/source-code-pro";
import { InteractionType } from "@/types/api";
// import { getExplorerUrl } from "@/utils/explorerUrl";

const network = process.env.EXPO_PUBLIC_APP_NETWORK!;
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
// const stripePublishableKey = network === "mainnet" ? process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY! : process.env.EXPO_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY!;


SplashScreen.preventAutoHideAsync();

function SplashFallback() {
  useEffect(
    () => () => {
      SplashScreen.hideAsync();
    },
    []
  );
  return null;
}

if (!clerkPublishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
}
const CustomDefaultTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: "rgb(0, 122, 255)", // System Blue
    background: "rgb(242, 242, 247)", // Light mode background
    card: "rgb(255, 255, 255)", // White cards/surfaces
    text: "rgb(0, 0, 0)", // Black text for light mode
    border: "rgb(216, 216, 220)", // Light gray for separators/borders
    notification: "rgb(255, 59, 48)", // System Red
  },
};

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
    background: "rgb(1, 1, 1)", // True black background for OLED displays
    card: "rgb(28, 28, 30)", // Dark card/surface color
    text: "rgb(255, 255, 255)", // White text for dark mode
    border: "rgb(44, 44, 46)", // Dark gray for separators/borders
    notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
  },
};



export default function Layout() {
  const colorScheme = useColorScheme();
  // Keep the splash screen visible while we fetch resources
  return (
    <Suspense fallback={<SplashFallback />}>
      {/* Load fonts in suspense */}
      <AsyncFont src={SourceCodePro_400Regular} fontFamily="Source Code Pro" />
      <ThemeProvider>
        <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
          <ClerkLoaded>
            {/* <StripeProvider publishableKey={stripePublishableKey}> */}

            <RNThemeProvider
              value={colorScheme === "dark"
                ? CustomDarkTheme
                : CustomDefaultTheme}
            >
              <GestureHandlerRootView>
                <UnifiedWalletProvider>
                
                  <ZplClientProvider>
                  
                        <Slot />
                        <StatusBar animated />
                        <SystemBars style={"auto"} />
                        {/* <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(index)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="+not-found" />
                <Stack.Screen
                  name="about"
                  modal
                  options={{
                    headerRight: () => (
                      <Form.Link headerRight bold href="/" dismissTo>
                        Done
                      </Form.Link>
                    ),
                  }}
                />
              </Stack> */}
                        {/* <StatusBar style="auto" /> */}

                        <Toast
                          config={{
                            warning: (props) => (
                              <BaseToast
                                {...props}
                                style={{ borderLeftColor: 'orange' }}
                                contentContainerStyle={{ backgroundColor: '#FFFBEA' }}
                                text1Style={{
                                  color: '#B7791F',
                                  fontWeight: 'bold',
                                }}
                                text2Style={{
                                  color: '#B7791F',
                                }}
                              />
                            ),
                            txSuccess: ({ props }) => (
                              <BaseToast
                                style={{ borderLeftColor: '#22c55e' }}
                                contentContainerStyle={{ backgroundColor: '#F0FFF4' }}
                                text1={props?.type === InteractionType.MintNFT ? "NFT Minted" : `${props.chain} Transaction Successful`}
                                text1Style={{ color: '#166534', fontWeight: 'bold', textDecorationLine: 'underline' }}
                                text2Style={{ color: '#166534' }}
                                text2={
                                  props?.txId && props?.network
                                    ? `Network: ${props.network} | TxID: ${props.txId}`
                                    : props?.txId
                                      ? `TxID: ${props.txId}`
                                      : props?.chain
                                        ? `Network: ${props.chain}`
                                        : ''
                                }
                                onPress={props?.onPress}
                              />
                            ),
                            txFail: ({ props }) => (
                              <BaseToast
                                style={{ borderLeftColor: '#ef4444' }}
                                contentContainerStyle={{ backgroundColor: '#FFF0F0' }}
                                text1="Transaction Failed"
                                text1Style={{ color: '#991b1b', fontWeight: 'bold' }}
                                text2Style={{ color: '#991b1b' }}
                                text2={props?.chain ? `Network: ${props.chain}` : ''}
                              />
                            ),
                            loading: ({ props }) => (
                              <BaseToast
                                style={{ borderLeftColor: 'yellow' }}
                                contentContainerStyle={{ backgroundColor: '#FFF0F0' }}
                                text1="Loading..."
                                text1Style={{ color: '#000000', fontWeight: 'bold' }}
                                text2Style={{ color: '#000000' }}
                                text2={props?.chain ? `Network: ${props.chain}` : ''}
                              />
                            ),
                          }}
                        />
                    
                  </ZplClientProvider>
               
                </UnifiedWalletProvider>
              </GestureHandlerRootView>
            </RNThemeProvider>
            {/* </StripeProvider> */}
          </ClerkLoaded>
        </ClerkProvider>
      </ThemeProvider>
    </Suspense>
  );
}

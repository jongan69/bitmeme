import * as Form from "@/components/ui/Form";
import Stack from "@/components/ui/Stack";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function AuthRoutesLayout() {
    const { isLoaded, isSignedIn } = useAuth();

    if (!isLoaded) return null;

    if (isSignedIn) return <Redirect href="/(home)/(index)" />;

    return (
        <Stack
            screenOptions={{
                ...(process.env.EXPO_OS !== "ios"
                    ? {}
                    : {
                        headerLargeTitle: true,
                        headerTransparent: true,
                        headerBlurEffect: "systemChromeMaterial",
                        headerLargeTitleShadowVisible: false,
                        headerShadowVisible: true,
                        headerLargeStyle: {
                            // NEW: Make the large title transparent to match the background.
                            backgroundColor: "transparent",
                        },
                    }),
            }}
        >
            <Stack.Screen
                name="index"
                options={{ headerTitle: "Welcome back!", headerShown: false }}
            />
            <Stack.Screen
                name="sign-in-email"
                options={{ headerTitle: "Sign in with Email" }}
            />
            <Stack.Screen name="sign-up" options={{ headerTitle: "Sign up" }} />
            <Stack.Screen
                name="reset-password"
                options={{ headerTitle: "Reset password" }}
            />
            {/* <Stack.Screen
        name="privacy-policy"
        options={{ headerTitle: "Privacy Policy" }}
      /> */}
            <Stack.Screen
                name="privacy"
                modal
                options={{
                    headerTitle: "Privacy Policy",
                    headerRight: () => (
                        <Form.Link headerRight bold href="/" dismissTo>
                            Done
                        </Form.Link>
                    ),
                }}
            />
        </Stack>
    );
}
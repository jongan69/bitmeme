import { BodyScrollView } from "@/components/ui/BodyScrollView";
import { TextInput } from "@/components/ui/TextInput";
import { ThemedButton, ThemedText } from "@/components/ui/themed";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { notifyError, notifySuccess } from "@/utils/notification";
import { isClerkAPIResponseError, useSignIn, useSSO } from "@clerk/clerk-expo";
import { ClerkAPIError } from "@clerk/types";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { StyleSheet, View } from "react-native";

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInEmail() {
  // Preload the browser for Android devices to reduce authentication load time
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [errors, setErrors] = React.useState<ClerkAPIError[]>([]);

  // Handle the submission of the sign-in form
  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;

    if (process.env.EXPO_OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSigningIn(true);
    setErrors([]);

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(home)/(index)");
        notifySuccess('Signed in!');
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
        notifyError('Failed to sign in');
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsSigningIn(false);
    }
  }, [isLoaded, signIn, emailAddress, password, setActive]);

  return (
    <BodyScrollView contentContainerStyle={styles.container}>
      <View style={styles.formSection}>
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          label="Email"
          keyboardType="email-address"
          placeholder="Enter your email"
          onChangeText={setEmailAddress}
        />
        <TextInput
          value={password}
          label="Password"
          placeholder="Enter your password"
          secureTextEntry={true}
          onChangeText={setPassword}
        />

        {errors.map((error) => (
          <ThemedText key={error.longMessage} style={styles.errorText}>
            {error.longMessage}
          </ThemedText>
        ))}

        <ThemedButton
          onPress={onSignInPress}
          loading={isSigningIn}
          disabled={!emailAddress || !password || isSigningIn}
          style={styles.signInButton}
        >
          Sign in
        </ThemedButton>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerSection}>
          <ThemedText style={styles.footerText}>
            Don't have an account?
          </ThemedText>
          <ThemedButton onPress={() => router.push("/sign-up")} variant="ghost">
            Sign up
          </ThemedButton>
        </View>

        <View style={styles.footerSection}>
          <ThemedText style={styles.footerText}>Forgot password?</ThemedText>
          <ThemedButton
            onPress={() => router.push("/reset-password")}
            variant="ghost"
          >
            Reset password
          </ThemedButton>
        </View>
      </View>
    </BodyScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 32,
  },
  formSection: {
    gap: 16,
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  signInButton: {
    marginTop: 8,
  },
  footer: {
    gap: 24,
  },
  footerSection: {
    alignItems: "center",
  },
  footerText: {
    color: "gray",
  },
});
import Landing from "@/components/ui/Landing";
import { useWalletOnboarding } from "@/hooks/useWallets";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { notifyError } from "@/utils/notification";
import { isClerkAPIResponseError, useAuth, useSSO } from "@clerk/clerk-expo";
import { ClerkAPIError } from "@clerk/types";
import * as AuthSession from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Platform, ScrollView } from "react-native";

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const [errors, setErrors] = React.useState<ClerkAPIError[]>([]);
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { solanaAddress, bitcoinAddress } = useWalletOnboarding(() => {
    if (isSignedIn && solanaAddress && bitcoinAddress) {
      router.replace("/(home)/(index)");
    }
  });

  const handleSignInWithGoogle = React.useCallback(async () => {
    if (isSignedIn) {
      notifyError("You're already signed in.");
      router.replace("/(home)/(index)");
      return;
    }
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          // concatenate (auth) since clerk's dashboard requires it
          // trying to use the scheme alone doesn't work, also for production
          // add the scheme in the "Allowlist for mobile SSO redirect" section under configure > sso connections
          redirectUrl: AuthSession.makeRedirectUri({ path: "(home)/(index)" }),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(home)/(index)");
      } else {
        notifyError('Failed to sign in: Unknown error');
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
      notifyError('Failed to sign in');
    }
  }, [isSignedIn, router, startSSOFlow]);

  const onNavigatePress = React.useCallback(
    (href: string) => {
      if (process.env.EXPO_OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      router.push(href as Href);
    },
    [router]
  );

  return Platform.OS === "web" ? (
    <ScrollView>
      <Landing
        onGoogleSignIn={handleSignInWithGoogle}
        onEmailSignIn={() => onNavigatePress("/sign-in-email")}
        onPrivacyPolicy={() => onNavigatePress("/privacy")}
      />
    </ScrollView>
  ) : (
    <Landing
      onGoogleSignIn={handleSignInWithGoogle}
      onEmailSignIn={() => onNavigatePress("/sign-in-email")}
      onPrivacyPolicy={() => onNavigatePress("/privacy")}
    />
  );
}
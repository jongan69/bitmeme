import * as React from "react";

// Components
import { ThemedText, ThemedButton } from "@/components/ui/themed";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import { TextInput } from "@/components/ui/TextInput";

// Hooks and Utils
import { useRouter } from "expo-router";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";

// Types
import { ClerkAPIError } from "@clerk/types";

export default function ResetPassword() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [errors, setErrors] = React.useState<ClerkAPIError[]>([]);

  const onResetPasswordPress = React.useCallback(async () => {
    if (!isLoaded) return;
    setErrors([]);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });

      setPendingVerification(true);
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, emailAddress, signIn]);

  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) setErrors(err.errors);
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, code, password, signIn, setActive, router]);

  if (pendingVerification) {
    return (
      <BodyScrollView contentContainerStyle={{ padding: 16 }}>
        <TextInput
          value={code}
          label={`Enter the verification code we sent to ${emailAddress}`}
          placeholder="Enter your verification code"
          onChangeText={setCode}
        />
        <TextInput
          value={password}
          label="Enter your new password"
          placeholder="Enter your new password"
          secureTextEntry
          onChangeText={setPassword}
        />
        {errors.map((error) => (
          <ThemedText key={error.longMessage} style={{ color: "red" }}>
            {error.longMessage}
          </ThemedText>
        ))}
        <ThemedButton onPress={onVerifyPress} disabled={!code || !password}>
          Reset password
        </ThemedButton>
      </BodyScrollView>
    );
  }

  return (
    <BodyScrollView contentContainerStyle={{ padding: 16 }}>
      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        keyboardType="email-address"
        onChangeText={setEmailAddress}
      />
      <ThemedButton onPress={onResetPasswordPress} disabled={!emailAddress}>
        Continue
      </ThemedButton>
      {errors.map((error) => (
        <ThemedText key={error.longMessage} style={{ color: "red" }}>
          {error.longMessage}
        </ThemedText>
      ))}
    </BodyScrollView>
  );
}
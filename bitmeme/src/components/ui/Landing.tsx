import * as Form from "@/components/ui/Form";
import ParallaxScrollView from "@/components/ui/ParallaxScrollView";
import { ThemedButton, ThemedText } from "@/components/ui/themed";
import { useWalletOnboarding } from "@/hooks/useWallets";
import * as AC from "@bacons/apple-colors";
import { useAuth } from "@clerk/clerk-expo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, useColorScheme, View } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

type LandingProps = {
  onGoogleSignIn: () => void;
  onEmailSignIn: () => void;
  onPrivacyPolicy: () => void;
};

const FEATURES = [
  { icon: "🔥", text: "AI meme creation" },
  { icon: "🔒", text: "Mint on STX" },
  { icon: "🌐", text: "Tip with crypto" },
];

export default function Landing({
  onGoogleSignIn,
  onEmailSignIn,
  onPrivacyPolicy,
}: LandingProps) {
  const theme = useColorScheme();
  const { isSignedIn } = useAuth();
  const { loading, solanaAddress, bitcoinAddress } = useWalletOnboarding(() => {
    if (isSignedIn && solanaAddress && bitcoinAddress) {
      router.replace("/(home)/(index)");
    }
  });

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#0F0F12', dark: '#0F0F12' }}
      headerImage={
        <Image
          source={require('../../../assets/images/icon.png')}
          style={styles.logo}
        />
      }>
      <Form.List navigationTitle="Welcome" listStyle="auto" style={{ backgroundColor: 'none', borderRadius: 16, marginBottom: 16 }}>
        <Form.Section>
          <View style={styles.centeredContainer}>
            <Text style={styles.mainTitle}>
              Welcome to BitMeme
            </Text>
            <Text style={styles.subtitle}>
              The easiest way to create, mint, and tip creators using Bitcoin.
            </Text>
            <View style={styles.actionSection}>
              <View
                style={[
                  styles.featuresSection,
                  {
                    backgroundColor: theme === 'dark' ? 'rgba(24,24,28,0.85)' : 'rgba(242,242,247,0.85)',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                {FEATURES.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', position: 'relative' }}>
                    <Text style={{ fontSize: 15, marginRight: 10 }}>{f.icon}</Text>
                    <Text
                      style={styles.featureText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {f.text}
                    </Text>
                    {i < FEATURES.length - 1 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                          width: '90%',
                          alignSelf: 'center',
                          position: 'absolute',
                          bottom: -1,
                          left: '5%',
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>


              <View style={{ height: 12 }} />
              <ThemedButton
                onPress={onGoogleSignIn}
                variant="outline"
                style={styles.button}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator size="small" style={{ marginRight: 12 }} />
                  ) : (
                    <MaterialCommunityIcons name="google" style={{ marginRight: 8 }} color={theme === "dark" ? "white" : "black"} />
                  )}
                  <ThemedText style={styles.buttonText}>
                    Continue with Google
                  </ThemedText>
                </View>
              </ThemedButton>
              <View style={{ height: 12 }} />
              <ThemedButton
                onPress={onEmailSignIn}
                variant="outline"
                style={styles.button}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator size="small" style={{ marginRight: 12 }} />
                  ) : (
                    <IconSymbol
                      name="envelope"
                      color={theme === "dark" ? "white" : "black"}
                      style={styles.buttonIcon}
                    />
                  )}
                  <ThemedText style={styles.buttonText}>
                    Continue with Email
                  </ThemedText>
                </View>
              </ThemedButton>
            </View>
            <View style={styles.footer}>
              <ThemedButton
                onPress={onPrivacyPolicy}
                variant="ghost"
                textStyle={styles.privacyPolicyText}
              >
                Privacy Policy
              </ThemedButton>
            </View>
          </View>
        </Form.Section>
      </Form.List>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  logo: {
    height: 160,
    width: 160,
    alignSelf: 'center',
    marginTop: 32,
    marginBottom: 8,
    borderRadius: 32,
    backgroundColor: '#18181C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    minHeight: 350,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: AC.label,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 18,
    color: AC.secondaryLabel,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '400',
    lineHeight: 26,
  },
  getStartedButton: {
    backgroundColor: AC.systemBlue,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
    marginBottom: 8,
    minWidth: 180,
    flexDirection: 'row', // for future icon + text
  },
  getStartedButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  getStartedButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.1,
  },
  featuresSection: {
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'stretch',
    width: '100%',
    // backdropFilter: 'blur(8px)', // for web, ignored on native
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AC.label,
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  featureText: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
    color: AC.label,
    marginBottom: 0,
    fontWeight: '500',
    letterSpacing: 0.1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  actionSection: {
    marginTop: 24,
    width: '100%',
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    width: '100%',
  },
  privacyPolicyText: {
    fontSize: 14,
    color: AC.secondaryLabel,
    textAlign: 'center',
  },
}); 
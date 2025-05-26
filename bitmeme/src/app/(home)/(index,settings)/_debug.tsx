import React from "react";

import * as Form from "@/components/ui/Form";
import Constants, { ExecutionEnvironment } from "expo-constants";

import * as Clipboard from "expo-clipboard";
import { IconSymbol } from "@/components/ui/IconSymbol";
import * as AC from "@bacons/apple-colors";
import * as Updates from "expo-updates";
import { ActivityIndicator, Linking, View } from "react-native";

import * as Application from "expo-application";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { getStoreUrlAsync, getHermesVersion, getReleaseTypeAsync, getDeploymentUrl } from "@/utils/debug";

const ENV_SUPPORTS_OTA =
  process.env.EXPO_OS !== "web" &&
  typeof window !== "undefined" &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export default function DebugRoute() {
  return (
    <Form.List navigationTitle="Debug">
      <AppStoreSection />
      <ExpoSection />

      <Form.Section title="Views">
        <Form.Link href="/_sitemap">/_sitemap</Form.Link>
        {process.env.EXPO_OS !== "web" && (
          <Form.Text
            onPress={() => Linking.openSettings()}
            hint={<IconSymbol name="gear" color={AC.secondaryLabel} />}
          >
            Open System Settings
          </Form.Text>
        )}
      </Form.Section>

      <OTADynamicSection />
      <OTASection />
    </Form.List>
  );
}

function AppStoreSection() {
  const [canOpenStore, setCanOpenStore] = useState(true);
  if (process.env.EXPO_OS === "web") {
    return null;
  }

  return (
    <Form.Section
      title={process.env.EXPO_OS === "ios" ? "App Store" : "Play Store"}
    >
      <Form.Text
        hint={`${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`}
        onPress={async () => {
          const appStoreLink = await getStoreUrlAsync();
          setCanOpenStore(!!appStoreLink);
          console.log("App Store link:", appStoreLink);
          if (appStoreLink) {
            // @ts-ignore: external URL
            router.push(appStoreLink);
          }
        }}
        style={{ color: AC.systemBlue }}
      >
        {canOpenStore ? `Check for app updates` : "App not available"}
      </Form.Text>
      <Form.Text hint={Application.applicationId}>
        {process.env.EXPO_OS === "ios" ? `Bundle ID` : "App ID"}
      </Form.Text>
    </Form.Section>
  );
}

function ExpoSection() {
  const sdkVersion = (() => {
    const current = Constants.expoConfig?.sdkVersion;
    if (current && current.includes(".")) {
      return current.split(".").shift();
    }
    return current ?? "unknown";
  })();

  const [envName, setEnvName] = useState<string | null>(null);
  useEffect(() => {
    getReleaseTypeAsync().then((name) => {
      setEnvName(name);
    });
  }, []);

  const hermes = getHermesVersion();

  return (
    <>
      <Form.Section title="Expo" titleHint={`SDK ${sdkVersion}`}>
        <Form.Text hint={envName}>Environment</Form.Text>
        {hermes && <Form.Text hint={hermes}>Hermes</Form.Text>}
        <Form.Text hint={__DEV__ ? "development" : "production"}>
          Mode
        </Form.Text>
      </Form.Section>
      <Form.Section>
        <Form.Link
          systemImage={"aqi.medium"}
          target="_blank"
          style={{ color: AC.systemBlue }}
          onLongPress={() => {
            Clipboard.setStringAsync(getDeploymentUrl());
            alert("Copied to clipboard");
          }}
          href={getDeploymentUrl()}
        >
          Expo Dashboard
        </Form.Link>
      </Form.Section>

      <Form.Section footer="Embedded origin URL that Expo Router uses to invoke React Server Functions. This should be hosted and available to the client.">
        <Form.Text hint={window.location?.href}>Host</Form.Text>
      </Form.Section>
    </>
  );
}

function OTADynamicSection() {
  if (process.env.EXPO_OS === "web") {
    return null;
  }
  const updates = Updates.useUpdates();

  const fetchingTitle = updates.isDownloading
    ? `Downloading...`
    : updates.isChecking
      ? `Checking for updates...`
      : updates.isUpdateAvailable
        ? "Reload app"
        : "Check again";

  const checkError = updates.checkError;
  // const checkError = new Error(
  //   "really long error name that hs sefsef sef sef sefsef sef eorhsoeuhfsef fselfkjhslehfse f"
  // ); // updates.checkError;

  const lastCheckTime = (
    updates.lastCheckForUpdateTimeSinceRestart
      ? new Date(updates.lastCheckForUpdateTimeSinceRestart)
      : new Date()
  ).toLocaleString("en-US", {
    timeZoneName: "short",
    dateStyle: "short",
    timeStyle: "short",
  });

  const isLoading = updates.isChecking || updates.isDownloading;
  return (
    <>
      <Form.Section
        title={
          !updates.availableUpdate ? "Synchronized ✓" : "Needs synchronization"
        }
        titleHint={isLoading ? <ActivityIndicator animating /> : lastCheckTime}
      >
        <Form.Text
          style={{
            color:
              updates.availableUpdate || !isLoading ? AC.systemBlue : AC.label,
          }}
          onPress={() => {
            if (__DEV__ && !ENV_SUPPORTS_OTA) {
              alert("OTA updates are not available in the Expo Go app.");
              return;
            }
            if (updates.availableUpdate) {
              Updates.reloadAsync();
            } else {
              Updates.checkForUpdateAsync();
            }
          }}
          hint={
            isLoading ? (
              <ActivityIndicator animating />
            ) : (
              <IconSymbol name="arrow.clockwise" color={AC.secondaryLabel} />
            )
          }
        >
          {fetchingTitle}
        </Form.Text>
        {checkError && (
          <Form.HStack style={{ flexWrap: "wrap" }}>
            <Form.Text style={{ color: AC.systemRed }}>
              Error checking status
            </Form.Text>
            {/* Spacer */}
            <View style={{ flex: 1 }} />
            {/* Right */}
            <Form.Text style={{ flexShrink: 1, color: AC.secondaryLabel }}>
              {checkError.message}
            </Form.Text>
          </Form.HStack>
        )}
      </Form.Section>
    </>
  );
}

function OTASection() {
  return (
    <>
      <Form.Section title="Current Update">
        <Form.Text hint={Updates.runtimeVersion}>Runtime version</Form.Text>
        <Form.Text hint={Updates.channel}>Channel</Form.Text>
        <Form.Text
          hint={(Updates.createdAt ?? new Date()).toLocaleString("en-US", {
            timeZoneName: "short",
          })}
        >
          Created
        </Form.Text>
        <Form.Text hintBoolean={Updates.isEmbeddedLaunch}>Embedded</Form.Text>
        <Form.Text hintBoolean={Updates.isEmergencyLaunch}>
          Emergency Launch
        </Form.Text>
        <Form.Text hint={String(Updates.launchDuration?.toFixed(0)) + "ms"}>
          Launch Duration
        </Form.Text>
        <Form.Text hint={Updates.updateId ?? "[none]"}>ID</Form.Text>
      </Form.Section>
    </>
  );
}

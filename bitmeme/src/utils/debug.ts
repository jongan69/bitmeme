import * as Application from "expo-application";
import Constants from "expo-constants";

// Async function to get App Store link by bundle ID, with caching
export async function getAppStoreLink(bundleId: string) {
    // Check cache first
    const cachedLink = localStorage.getItem(`appStoreLink_${bundleId}`);
    if (cachedLink) {
      console.log(`Returning cached App Store link for ${bundleId}`);
      return cachedLink;
    }
  
    // Make API call to iTunes Search API
    const response = await fetch(
      `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}`
    );
  
    // Check if response is OK
    if (!response.ok) {
      throw new Error(
        `Failed to query App Store URL. Status: ${response.status}`
      );
    }
  
    const data = await response.json();
  
    // Validate API response
    if (data.resultCount === 0 || !data.results[0]?.trackId) {
      throw new Error(`No app found for bundle ID on App Store: ${bundleId}`);
    }
  
    // Extract App ID and construct App Store link
    const appId = data.results[0].trackId;
    const appStoreLink = `https://apps.apple.com/app/id${appId}`;
  
    // Cache the successful result
    localStorage.setItem(`appStoreLink_${bundleId}`, appStoreLink);
    console.log(`Cached App Store link for ${bundleId}`);
  
    return appStoreLink;
  }

export async function getStoreUrlAsync() {
    if (process.env.EXPO_OS === "ios") {
      return await getAppStoreLinkAsync();
    } else if (process.env.EXPO_OS === "android") {
      return `https://play.google.com/store/apps/details?id=${Application.applicationId}`;
    }
    return null;
  }

export async function getAppStoreLinkAsync() {
  if (process.env.EXPO_OS !== "ios") {
    return null;
  }
  try {
    const link = await getAppStoreLink(Application.applicationId!);
    return link;
  } catch (error: any) {
    console.error("Error fetching App Store link:", error);
    alert(error.message);
    return null;
  }
}

export function getHermesVersion() {
    // @ts-expect-error
    const HERMES_RUNTIME = global.HermesInternal?.getRuntimeProperties?.() ?? {};
    const HERMES_VERSION = HERMES_RUNTIME["OSS Release Version"];
    const isStaticHermes = HERMES_RUNTIME["Static Hermes"];
  
    if (!HERMES_RUNTIME) {
      return null;
    }
  
    if (isStaticHermes) {
      return `${HERMES_VERSION} (shermes)`;
    }
    return HERMES_VERSION;
  }

  export async function getReleaseTypeAsync() {
    if (process.env.EXPO_OS === "ios") {
      const releaseType = await Application.getIosApplicationReleaseTypeAsync();
  
      const suffix = (() => {
        switch (releaseType) {
          case Application.ApplicationReleaseType.AD_HOC:
            return "Ad Hoc";
          case Application.ApplicationReleaseType.ENTERPRISE:
            return "Enterprise";
          case Application.ApplicationReleaseType.DEVELOPMENT:
            return "Development";
          case Application.ApplicationReleaseType.APP_STORE:
            return "App Store";
          case Application.ApplicationReleaseType.SIMULATOR:
            return "Simulator";
          case Application.ApplicationReleaseType.UNKNOWN:
          default:
            return "unknown";
        }
      })();
      return `${Application.applicationName} (${suffix})`;
    } else if (process.env.EXPO_OS === "android") {
      return `${Application.applicationName}`;
    }
  
    return null;
  }
  
  // Get the linked server deployment URL for the current app. This makes it easy to open
  // the Expo dashboard and check errors/analytics for the current version of the app you're using.
  export function getDeploymentUrl(): any {
    const deploymentId = (() => {
      // https://expo.dev/accounts/bacon/projects/expo-ai/hosting/deployments/o70t5q6t0r/requests
      const origin = Constants.expoConfig?.extra?.router?.origin;
      if (!origin) {
        return null;
      }
      try {
        const url = new URL(origin);
        // Should be like: https://exai--xxxxxx.expo.app
        // We need to extract the `xxxxxx` part if the URL matches `[\w\d]--([])`.
        return url.hostname.match(/(?:[^-]+)--([^.]+)\.expo\.app/)?.[1] ?? null;
      } catch {
        return null;
      }
    })();
  
    const dashboardUrl = (() => {
      // TODO: There might be a better way to do this, using the project ID.
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (projectId) {
        // https://expo.dev/projects/[uuid]
        return `https://expo.dev/projects/${projectId}`;
      }
      const owner = Constants.expoConfig?.owner ?? "[account]";
      const slug = Constants.expoConfig?.slug ?? "[project]";
  
      return `https://expo.dev/accounts/${owner}/projects/${slug}`;
    })();
  
    let deploymentUrl = `${dashboardUrl}/hosting/deployments`;
    if (deploymentId) {
      deploymentUrl += `/${deploymentId}/requests`;
    }
    return deploymentUrl;
  }
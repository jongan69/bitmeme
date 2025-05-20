import React from "react";
import PrivacyPolicy from "@/components/ui/web/PrivacyDom";
import { Stack } from "expo-router";
import Head from "expo-router/head";

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy | Pillar Valley</title>
      </Head>
      <Stack.Screen
        options={{
          title: "Privacy Policy",
        }}
      />
      <PrivacyPolicy dom={{}} />
    </>
  );
}

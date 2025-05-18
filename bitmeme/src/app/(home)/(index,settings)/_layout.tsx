import Stack from "@/components/ui/Stack";
import * as AC from "@bacons/apple-colors";
import { Image, Text, View } from "react-native";

import * as Form from "@/components/ui/Form";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useMemo } from "react";
import { useUser } from "@clerk/clerk-expo";

export const unstable_settings = {
  index: {
      initialRouteName: "home",
  },
  meme: {
      initialRouteName: "meme",
  },
  settings: {
      initialRouteName: "settings",
  },
};
export default function Layout({ segment }: { segment: string }) {
  const screenName = segment.match(/\((.*)\)/)?.[1]!;

  const firstScreen = useMemo(() => {
    if (screenName === "settings") {
      return (
        <Stack.Screen
          name="settings"
          options={{
            headerRight: () => (
              <Form.Link headerRight href="/account">
                <Avatar />
              </Form.Link>
            ),
          }}
        />
      );
    } else {
      return <Stack.Screen name={screenName} />;
    }
  }, [screenName]);

  return (
    <Stack>
      {firstScreen}

      <Stack.Screen
        name="icon"
        sheet
        options={{
          headerLargeTitle: false,
          // Quarter sheet with no pulling allowed
          headerTransparent: false,
          sheetGrabberVisible: false,
          sheetAllowedDetents: [0.25],
          headerRight: () => (
            <Form.Link headerRight href="/(home)/(settings)/settings" dismissTo>
              <IconSymbol
                name="xmark.circle.fill"
                color={AC.systemGray}
                size={28}
              />
            </Form.Link>
          ),
        }}
      />

      <Stack.Screen
        name="account"
        modal
        options={{
          headerRight: () => (
            <Form.Link headerRight bold href="/(home)/(settings)/settings" dismissTo>
              Done
            </Form.Link>
          ),
        }}
      />

      <Stack.Screen
        name="privacy"
        modal
        options={{
          headerRight: () => (
            <Form.Link headerRight bold href="/(home)/(settings)/settings" dismissTo>
              Done
            </Form.Link>
          ),
        }}
      />
      <Stack.Screen
        name="_debug"
        modal
        options={{
          headerRight: () => (
            <Form.Link headerRight bold href="/(home)/(settings)/settings" dismissTo>
              Done
            </Form.Link>
          ),
        }}
      />
    </Stack>
  );
}

function Avatar() {
  const { user } = useUser();
  return (
    <View
      style={{
        padding: 6,
        borderRadius: 99,
        [process.env.EXPO_OS === "web"
          ? `backgroundImage`
          : `experimental_backgroundImage`]: `linear-gradient(to bottom, #A5ABB8, #858994)`,
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
     <Image
        source={{ uri: user?.imageUrl }}
        style={{ width: 32, height: 32, borderRadius: 99 }}
      />
    </View>
  );
}

import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import * as Form from "@/components/ui/Form";
import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  Segments,
  SegmentsContent,
  SegmentsList,
  SegmentsTrigger,
} from "@/components/ui/Segments";
import Stack from "@/components/ui/Stack";
import * as AC from "@bacons/apple-colors";
import { Image } from "expo-image";
import { useNetworkState } from 'expo-network';
import { router } from "expo-router";
import React, { ComponentProps } from "react";
import { Button, OpaqueColorValue, Switch, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { GlurryList } from "@/components/ui/glurry-modal";
import { useSolanaWallet, WalletService } from "@/contexts/SolanaWalletProvider";
import { useWalletOnboarding } from "@/hooks/useWallets";
import TwitterSvg from "@/svg/twitter.svg";
import { notifyError, notifySuccess } from "@/utils/notification";
import { useClerk } from "@clerk/clerk-expo";
import * as Network from 'expo-network';
import useStacksBalance from "@/hooks/misc/useStacksBalance";


function Switches() {
  const [on, setOn] = React.useState(false);

  return (
    <Form.Section title="Settings">
      <Form.Text
        systemImage={"banknote.fill"}
        hint={<Switch value={on} onValueChange={setOn} />}
      >
        Auto-Tip on like
      </Form.Text>
    </Form.Section>
  );
}

export default function Page() {
  const { connection } = useSolanaWallet();
  const { solanaAddress, bitcoinAddress, stacksAddress } = useWalletOnboarding();
  const { data: balance, isLoading, mutate } = useStacksBalance(stacksAddress);
  const { signOut } = useClerk();

  const networkState = useNetworkState();
  const [manualNetworkState, setManualNetworkState] = React.useState<typeof networkState | null>(null);
  const isConnected = (manualNetworkState ?? networkState).isConnected && (manualNetworkState ?? networkState).isInternetReachable;

  // RPC connection state
  const [rpcConnected, setRpcConnected] = React.useState<boolean | null>(null);
  const [rpcChecking, setRpcChecking] = React.useState(false);

  const checkRpcConnection = React.useCallback(async () => {
    if (!connection) {
      setRpcConnected(false);
      return;
    }
    setRpcChecking(true);
    try {
      await connection.getBlockHeight();
      setRpcConnected(true);
    } catch (e) {
      setRpcConnected(false);
    } finally {
      setRpcChecking(false);
    }
  }, [connection]);

  React.useEffect(() => {
    checkRpcConnection();
  }, [checkRpcConnection]);

  const handleReset = async () => {
    try {
      await signOut();
      const wallet = await WalletService.loadWallet();
      console.log('wallet', wallet);
      notifySuccess('Signed out!');
    } catch (e) {
      notifyError(`Failed to reset wallet: ${String(e)}`);
    } finally {
      router.replace('/(auth)');
    }
  };

  const handleRefresh = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setManualNetworkState(state);
    } catch (e) {
      // Optionally handle error
    }
  };

  const ref = useAnimatedRef();
  const scroll = useScrollViewOffset(ref as any);
  const style = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scroll.value, [0, 30], [0, 1], "clamp"),
      transform: [
        { translateY: interpolate(scroll.value, [0, 30], [5, 0], "clamp") },
      ],
    };
  });

  const [show, setShow] = React.useState(false);

  return (
    <View style={{ flex: 1 }}>
      {show &&
        <GlurryList
          setShow={setShow}
          solanaWalletAddress={solanaAddress?.toString() ?? ''}
          bitcoinAddress={bitcoinAddress ?? ''}
          stacksAddress={stacksAddress ?? ''}
        />
      }
      <Stack.Screen
        options={{
          headerLargeTitle: false,
          headerTitle() {
            if (process.env.EXPO_OS === "web") {
              return (
                <Animated.View
                  style={[
                    style,
                    { flexDirection: "row", gap: 12, alignItems: "center" },
                  ]}
                >
                  <Image
                    source={{ uri: `https://www.gravatar.com/avatar/${bitcoinAddress}?s=250` }}
                    style={[
                      {
                        aspectRatio: 1,
                        height: 30,
                        borderRadius: 8,
                        borderWidth: 0.5,
                        borderColor: AC.separator,
                      },
                    ]}
                  />
                  <Text
                    style={{
                      fontSize: 20,
                      color: AC.label,
                      fontWeight: "bold",
                    }}
                  >
                    {bitcoinAddress ?? 'Loading...'}
                  </Text>
                </Animated.View>
              );
            }
            return (
              <Animated.Image
                source={{ uri: `https://www.gravatar.com/avatar/${bitcoinAddress}?s=250` }}
                style={[
                  style,
                  {
                    aspectRatio: 1,
                    height: 30,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: AC.separator,
                  },
                ]}
              />
            );
          },
        }}
      />
      {/* @ts-ignore */}
      <Form.List ref={ref} navigationTitle="Settings">
        <Form.Section>
          <View style={{ alignItems: "center", gap: 8, padding: 16, flex: 1 }}>
            <Image
              source={{ uri: `https://www.gravatar.com/avatar/${bitcoinAddress}?s=250` }}
              style={{
                aspectRatio: 1,
                height: 64,
                borderRadius: 8,
              }}
            />
            <Form.Text
              style={{
                fontSize: 20,
                fontWeight: "600",
              }}
            >
              Welcome to BitMeme!
            </Form.Text>
            <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
              Your STX balance: {balance?.toString()}
            </Form.Text>
            <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
              Your Bitcoin, Solana, and Stacks Wallets are stored locally on your device.{" "}
            </Form.Text>
          </View>
        </Form.Section>

        <Form.Section title="Data">
          <Form.Text
            onPress={() => {
              setShow(true);
            }}
          >
            View your Wallets
          </Form.Text>
          <Form.Link href="/icon">Change App Icon</Form.Link>
          <Form.Link href="/_debug">Debug menu</Form.Link>
          <Form.Link href="/privacy">Privacy Policy</Form.Link>
        </Form.Section>

        <Form.Section>
          <Form.HStack style={{ alignItems: "stretch", gap: 12 }}>
            <TripleItemTest />
          </Form.HStack>
        </Form.Section>



        <Switches />
        <Form.Section title="Status">
          {(manualNetworkState ?? networkState).isConnected === null ? (
            <ContentUnavailable
              internet
              title="Checking connection..."
              description="Please wait."
            />
          ) : (
            <ContentUnavailable
              internet
              actions={<Button title="Refresh" onPress={handleRefresh} />}
              title={isConnected ? "Internet Connected" : "No Internet Connection"}
              description={isConnected ? "Ready to spam memes!" : "Please check your connection."}
            />
          )}

          <ContentUnavailable
            title="RPC Connection"
            systemImage="network"
            actions={<Button title="Refresh" onPress={checkRpcConnection} disabled={rpcChecking} />}
            description={
              rpcConnected === null
                ? "Checking RPC connection..."
                : rpcConnected
                  ? "Connected to Helius RPC"
                  : "Not connected to Helius RPC"
            }
          />
          <ContentUnavailable
            title="Bitcoin Wallet"
            systemImage="banknote"
            description={bitcoinAddress ? "Ready to receive tips!" : "No Bitcoin wallet found"}
          />
        </Form.Section>


        <Form.Section title="App Info">
          <Form.Text hint="BitMeme v1.0">Version</Form.Text>
          <Form.Text hint="0">Sats Tipped</Form.Text>

          <FormExpandable
            hint="This app is in beta. Please report any issues."
            preview="Works on this iPhone"
            custom
          >
            Compatibility
          </FormExpandable>
        </Form.Section>

        <Form.Section>
          <Form.Link
            href="https://github.com/EvanBacon/expo-router-forms-components"
            target="_blank"
            systemImage={
              <TwitterSvg
                fill={AC.label}
                style={{ width: 18, height: 18, marginRight: 8 }}
              />
            }
            style={{ color: AC.systemBlue, fontWeight: "400" }}
          >
            Tweet at us!
          </Form.Link>
        </Form.Section>

        <Form.Section>
          <Button
            title="Logout"
            color={AC.systemRed}
            onPress={handleReset}
          />
        </Form.Section>
      </Form.List>
    </View>
  );
}

function FormExpandable({
  children,
  hint,
  preview,
}: {
  custom: true;
  children?: React.ReactNode;
  hint?: string;
  preview?: string;
}) {
  const [open, setOpen] = React.useState(false);

  // TODO: If the entire preview can fit, then just skip the hint.

  return (
    <Form.FormItem onPress={() => setOpen(!open)}>
      <Form.HStack style={{ flexWrap: "wrap" }}>
        <Form.Text>{children}</Form.Text>
        {/* Spacer */}
        <View style={{ flex: 1 }} />
        {open && (
          <IconSymbol
            name={open ? "chevron.up" : "chevron.down"}
            size={16}
            color={AC.systemGray}
          />
        )}
        {/* Right */}
        <Form.Text style={{ flexShrink: 1, color: AC.secondaryLabel }}>
          {open ? hint : preview}
        </Form.Text>
        {!open && (
          <IconSymbol
            name={open ? "chevron.up" : "chevron.down"}
            size={16}
            color={AC.systemGray}
          />
        )}
      </Form.HStack>
    </Form.FormItem>
  );
}

function FormLabel({
  children,
  systemImage,
  color,
}: {
  /** Only used when `<FormLabel />` is a direct child of `<Section />`. */
  onPress?: () => void;
  children: React.ReactNode;
  systemImage: ComponentProps<typeof IconSymbol>["name"];
  color?: OpaqueColorValue;
}) {
  return (
    <Form.HStack style={{ gap: 16 }}>
      <IconSymbol name={systemImage} size={28} color={color ?? AC.systemBlue} />
      <Text style={Form.FormFont.default}>{children}</Text>
    </Form.HStack>
  );
}

function SegmentsTest() {
  return (
    <View style={{ flex: 1 }}>
      <Segments defaultValue="account">
        <SegmentsList>
          <SegmentsTrigger value="account">Account</SegmentsTrigger>
          <SegmentsTrigger value="password">Password</SegmentsTrigger>
        </SegmentsList>

        <SegmentsContent value="account">
          <Form.Text style={{ paddingVertical: 12 }}>Account Section</Form.Text>
        </SegmentsContent>
        <SegmentsContent value="password">
          <Form.Text style={{ paddingVertical: 12 }}>
            Password Section
          </Form.Text>
        </SegmentsContent>
      </Segments>
    </View>
  );
}

function TripleItemTest() {
  return (
    <>
      <HorizontalItem title="Launched" badge="May" subtitle="2025" />

      <View
        style={{
          backgroundColor: AC.separator,
          width: 0.5,
          maxHeight: "50%",
          minHeight: "50%",
          marginVertical: "auto",
        }}
      />

      <HorizontalItem
        title="Developer"
        badge={
          <IconSymbol
            name="person.text.rectangle"
            size={28}
            weight="bold"
            animationSpec={{
              effect: {
                type: "pulse",
              },
              repeating: true,
            }}
            color={AC.secondaryLabel}
          />
        }
        subtitle="BitMeme Dev"
      />

      <View
        style={{
          backgroundColor: AC.separator,
          width: 0.5,
          maxHeight: "50%",
          minHeight: "50%",
          marginVertical: "auto",
        }}
      />

      <HorizontalItem title="Version" badge="v1.0" subtitle="Initial Release" />
    </>
  );
}

function HorizontalItem({
  title,
  badge,
  subtitle,
}: {
  title: string;
  badge: React.ReactNode;
  subtitle: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 4, flex: 1 }}>
      <Form.Text
        style={{
          textTransform: "uppercase",
          fontSize: 10,
          fontWeight: "600",
          color: AC.secondaryLabel,
        }}
      >
        {title}
      </Form.Text>
      {typeof badge === "string" ? (
        <Form.Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: AC.secondaryLabel,
          }}
        >
          {badge}
        </Form.Text>
      ) : (
        badge
      )}

      <Form.Text
        style={{
          fontSize: 12,
          color: AC.secondaryLabel,
        }}
      >
        {subtitle}
      </Form.Text>
    </View>
  );
}

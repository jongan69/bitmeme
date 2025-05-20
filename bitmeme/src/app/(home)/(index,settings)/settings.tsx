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
import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { Button, Switch, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

import { GlurryList } from "@/components/ui/glurry-modal";
import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import { useWalletOnboarding } from "@/hooks/useWallets";
import TwitterSvg from "@/svg/twitter.svg";
import { notifyError, notifySuccess } from "@/utils/notification";
import { useClerk } from "@clerk/clerk-expo";
import * as Network from 'expo-network';
import useStacksBalance from "@/hooks/misc/useStacksBalance";
import TextInput from "@/components/ui/TextInput";
import { useTipSettingsStore } from "@/stores/tipSettingsStore";
import { useHoldings } from "@/hooks/misc/useHoldings";
import { PublicKey } from "@solana/web3.js";
import Icon from "@/components/ui/Icons";
import TouchableBounce from "@/components/ui/TouchableBounce";
import useBitcoinUTXOs from "@/hooks/ares/useBitcoinUTXOs";
import { estimateMaxSpendableAmount } from "@/bitcoin";
import useTwoWayPegConfiguration from "@/hooks/zpl/useTwoWayPegConfiguration";
import { useMultiAirdrop } from "@/hooks/useMultiAirdrop";
import { SolanaNetwork, BitcoinNetwork } from "@/types/store";

function Switches({ autoTipOn, setAutoTipOn }: { autoTipOn: boolean; setAutoTipOn: (value: boolean) => void }) {
  return (
    <Form.Section title="Settings">
      <Form.Text
        systemImage={"banknote.fill"}
        hint={<Switch value={autoTipOn} onValueChange={setAutoTipOn} />}
      >
        Auto-Tip on like
      </Form.Text>
    </Form.Section>
  );
}

const BalancesSection = memo(function BalancesSection({
  onRefresh,
  isRefreshing,
  balance,
  nativeBalance,
  spendableUTXOs,
  gravatarUri,
}: {
  stacksAddress: string;
  solanaAddress: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  balance: any;
  nativeBalance: any;
  spendableUTXOs: any;
  gravatarUri: string;
}) {
  return (
    <Form.Section>
      <View style={{ alignItems: "center", gap: 8, padding: 16, flex: 1, width: '100%' }}>
        <Image
          source={{ uri: gravatarUri }}
          style={{
            aspectRatio: 1,
            height: 64,
            borderRadius: 8,
          }}
        />
        <Form.Text style={{ fontSize: 20, fontWeight: "600" }}>
          Welcome to BitMeme!
        </Form.Text>
        <Form.HStack style={{ justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <View style={{ flex: 1 }}>
            <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
              Your STX balance: {balance?.toString()}
            </Form.Text>
              <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
                Your SOL balance: {nativeBalance.lamports}
              </Form.Text>
              <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
                Your BTC balance: {spendableUTXOs}
              </Form.Text>
          </View>
          <TouchableBounce
            onPress={onRefresh}
            sensory
            style={{ marginLeft: 8, padding: 8 }}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Icon name="ButtonLoader" size={24} />
            ) : (
              <Icon name="Swap" size={24} />
            )}
          </TouchableBounce>
        </Form.HStack>
      </View>
    </Form.Section>
  );
});

const RpcStatusSection = memo(function RpcStatusSection({
  rpcConnected,
  rpcChecking,
  onRefresh,
}: {
  rpcConnected: boolean | null;
  rpcChecking: boolean;
  onRefresh: () => void;
}) {
  return (
    <ContentUnavailable
      title="RPC Connection"
      systemImage="network"
      actions={<Button title="Refresh" onPress={onRefresh} disabled={rpcChecking} />}
      description={
        rpcConnected === null
          ? "Checking RPC connection..."
          : rpcConnected
            ? "Connected to Helius RPC"
            : "Not connected to Helius RPC"
      }
    />
  );
});

export default function Page() {
  const { connection } = useSolanaWallet();
  const { solanaAddress, bitcoinAddress, stacksAddress } = useWalletOnboarding();
  const { data: balance, mutate, isValidating: isStacksValidating } = useStacksBalance(stacksAddress || "");
  const { feeRate } = useTwoWayPegConfiguration();

  // Memoize gravatar URI
  const gravatarUri = useMemo(
    () => `https://www.gravatar.com/avatar/${bitcoinAddress || ''}?s=250`,
    [bitcoinAddress]
  );

  // Memoize PublicKey to prevent infinite loop in useHoldings
  const publicKey = useMemo(
    () => (solanaAddress ? new PublicKey(solanaAddress) : null),
    [solanaAddress]
  );

  // Use memoized publicKey in useHoldings
  const holdingsResult = publicKey ? useHoldings(publicKey) : { nativeBalance: { lamports: 0 }, refetch: () => {}, loading: false };
  const nativeBalance = holdingsResult.nativeBalance;
  const refetchNativeBalance = holdingsResult.refetch;
  const isSolLoading = holdingsResult.loading;
  const { data: bitcoinUTXOs, mutate: refetchBitcoinUTXOs, isLoading: isBitcoinLoading } = useBitcoinUTXOs(bitcoinAddress ?? null);

  const [spendableUTXOs, setSpendableUTXOs] = useState(() => estimateMaxSpendableAmount(bitcoinUTXOs ?? [], feeRate));

  useEffect(() => {
    setSpendableUTXOs(estimateMaxSpendableAmount(bitcoinUTXOs ?? [], feeRate));
  }, [bitcoinUTXOs, feeRate]);
  
  const { signOut } = useClerk();

  const networkState = useNetworkState();
  const [manualNetworkState, setManualNetworkState] = React.useState<typeof networkState | null>(null);
  const isConnected = (manualNetworkState ?? networkState).isConnected && (manualNetworkState ?? networkState).isInternetReachable;

  // RPC connection state
  const [rpcConnected, setRpcConnected] = React.useState<boolean | null>(null);
  const [rpcChecking, setRpcChecking] = React.useState(false);

  const { tipCurrency, setTipCurrency, tipAmount, setTipAmount, autoTipOn, setAutoTipOn } = useTipSettingsStore();
  const hasHydrated = useTipSettingsStore.persist?.hasHydrated();

  const [showBalances, setShowBalances] = useState(false);
  const [showRpcStatus, setShowRpcStatus] = useState(false);
  const [show, setShow] = React.useState(false);

  // MultiAirdrop hook
  const { requestAirdrops, results: airdropResults, loading: airdropLoading } = useMultiAirdrop();

  // Add this function:
  const refreshBalances = useCallback(() => {
    mutate();
    refetchNativeBalance();
    refetchBitcoinUTXOs();
  }, [mutate, refetchNativeBalance, refetchBitcoinUTXOs]);

  // Change handleShowBalances to:
  const handleShowBalances = useCallback(() => {
    if (!showBalances) {
      setShowBalances(true);
      refreshBalances();
    }
  }, [showBalances, refreshBalances]);

  // Airdrop handler
  const handleAirdrop = async () => {
    await requestAirdrops({
      solanaAddresses: solanaAddress ? [solanaAddress] : [],
      bitcoinAddresses: bitcoinAddress ? [bitcoinAddress] : [],
      stxAddresses: stacksAddress ? [stacksAddress] : [],
      solanaNetwork: SolanaNetwork.Devnet,
      bitcoinNetwork: BitcoinNetwork.Regtest,
    });
  };

  // Only check RPC when user requests
  const checkRpcConnection = useCallback(async () => {
    setShowRpcStatus(true);
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

  const handleReset = async () => {
    console.log('handleReset called');
    try {
      signOut();
      console.log('signOut called (not awaited)');
      notifySuccess('Signed out!');
      router.replace('/(auth)');
      console.log('router.replace called');
    } catch (e) {
      console.log('Error in handleReset:', e);
      notifyError(`Failed to reset wallet: ${String(e)}`);
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

  // Use validation/loading flags for spinner
  const isRefreshingBalances = isStacksValidating || isSolLoading || isBitcoinLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={{ flex: 1 }}>
        {show &&
          <GlurryList
            setShow={setShow}
            solanaWalletAddress={solanaAddress ? solanaAddress.toString() : ''}
            bitcoinAddress={bitcoinAddress || ''}
            stacksAddress={stacksAddress || ''}
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
                      source={{ uri: gravatarUri }}
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
                  source={{ uri: gravatarUri }}
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
          {/* Show Balances Button and Section */}
          <Form.Section>
            <Button title="Show Balances" onPress={handleShowBalances} disabled={isRefreshingBalances} />
          </Form.Section>
          {showBalances && (
            <BalancesSection
              stacksAddress={stacksAddress || ''}
              solanaAddress={solanaAddress || ''}
              onRefresh={refreshBalances}
              isRefreshing={isRefreshingBalances}
              balance={balance}
              nativeBalance={nativeBalance}
              spendableUTXOs={spendableUTXOs}
              gravatarUri={gravatarUri}
            />
          )}
          <Form.Section>
            <Button
              title={airdropLoading ? "Requesting Airdrops..." : "Request Airdrops"}
              onPress={handleAirdrop}
              disabled={airdropLoading}
            />
            {airdropResults.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {airdropResults.map((result) => (
                  <Text key={result.address + result.type}>
                    {result.type.toUpperCase()} {result.address}: {result.status}
                  </Text>
                ))}
              </View>
            )}
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

          <Switches autoTipOn={autoTipOn} setAutoTipOn={setAutoTipOn} />
          {autoTipOn && hasHydrated && (
            <Segments value={tipCurrency} onValueChange={setTipCurrency}>
              <SegmentsList>
                <SegmentsTrigger value="STX">STX</SegmentsTrigger>
                <SegmentsTrigger value="SOL">SOL</SegmentsTrigger>
                <SegmentsTrigger value="BTC">BTC</SegmentsTrigger>
              </SegmentsList>
              <SegmentsContent value="STX">
                <Form.Text>STX selected</Form.Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="Enter micro-payment amount"
                  label="Amount (in micro-payments)"
                />
              </SegmentsContent>
              <SegmentsContent value="SOL">
                <Form.Text>SOL selected</Form.Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="Enter micro-payment amount"
                  label="Amount (in micro-payments)"
                />
              </SegmentsContent>
              <SegmentsContent value="BTC">
                <Form.Text>BTC selected</Form.Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="Enter micro-payment amount"
                  label="Amount (in micro-payments)"
                />
              </SegmentsContent>
            </Segments>
          )}

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
            {/* Show RPC Status Button and Section */}
            <Form.Section>
              <Button title="Check RPC Status" onPress={checkRpcConnection} disabled={rpcChecking} />
            </Form.Section>
            {showRpcStatus && (
              <RpcStatusSection
                rpcConnected={rpcConnected}
                rpcChecking={rpcChecking}
                onRefresh={checkRpcConnection}
              />
            )}
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
    </KeyboardAvoidingView>
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

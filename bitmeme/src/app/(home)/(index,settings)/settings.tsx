import React, { useState, useCallback, useMemo } from "react";
import { Button, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { useNetworkState } from 'expo-network';
import { router } from "expo-router";
import * as Network from 'expo-network';
import * as AC from "@bacons/apple-colors";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";

// Components
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import * as Form from "@/components/ui/Form";
import {
  Segments,
  SegmentsContent,
  SegmentsList,
  SegmentsTrigger,
} from "@/components/ui/Segments";
import Stack from "@/components/ui/Stack";
import { GlurryList } from "@/components/ui/glurry-modal";
import TextInput from "@/components/ui/TextInput";

// Hooks
import { useWalletOnboarding } from "@/hooks/useWallets";
import { useClerk } from "@clerk/clerk-expo";
import useStacksBalance from "@/hooks/misc/useStacksBalance";
import { useTipSettingsStore } from "@/stores/tipSettingsStore";
import { useHoldings } from "@/hooks/misc/useHoldings";
import { useMultiAirdrop } from "@/hooks/useMultiAirdrop";
import { useBtcBalanceSats } from "@/hooks/misc/useBtcBalanceSats";
import { useUnifiedWallet } from "@/contexts/UnifiedWalletProvider";

// Graphics
import TwitterSvg from "@/svg/twitter.svg";
import headerLogo from "@/images/headerlogo.png";

// Utils
import { notifyError, notifySuccess } from "@/utils/notification";
import { PublicKey } from "@solana/web3.js";
import usePersistentStore from "@/stores/local/persistentStore";

// Types
import { SolanaNetwork, BitcoinNetwork } from "@/types/store";
import { RpcStatusSection } from "@/components/ui/RpcStatusSection";
import { BalancesSection } from "@/components/ui/BalanceSection";
import { AutoTipSwitch } from "@/components/ui/AutoTipSwitch";
import { TripleItem } from "@/components/ui/TripleItem";
import { FormExpandable } from "@/components/ui/FormExpandable";

const isDev = process.env.EXPO_PUBLIC_APP_NETWORK === "devnet";

export default function Page() {
  const { solanaAddress, bitcoinAddress, stacksAddress } = useWalletOnboarding();
  const appNetwork = usePersistentStore((state) => state.appNetwork);
  const { data: balance, mutate, isValidating: isStacksValidating } = useStacksBalance(stacksAddress || "", appNetwork);

  console.log("balance", balance);
  // Memoize gravatar URI
  // const gravatarUri = useMemo(
  //   () => `https://www.gravatar.com/avatar/${bitcoinAddress || ''}?s=250`,
  //   [bitcoinAddress]
  // );

  // Memoize PublicKey to prevent infinite loop in useHoldings
  const publicKey = useMemo(
    () => (solanaAddress ? new PublicKey(solanaAddress) : null),
    [solanaAddress]
  );

  // Use memoized publicKey in useHoldings
  const holdingsResult = publicKey ? useHoldings(publicKey) : { nativeBalance: { lamports: 0 }, refetch: () => { }, loading: false };
  const { balance: btcBalance, loading: btcLoading, error: btcError, refresh: btcRefresh } = useBtcBalanceSats(bitcoinAddress ?? null, BitcoinNetwork.Testnet);
  const nativeBalance = holdingsResult.nativeBalance;
  const refetchNativeBalance = holdingsResult.refetch;
  const isSolLoading = holdingsResult.loading;

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
  const [, setShowRpcStatus] = useState(false);
  const [show, setShow] = React.useState(false);

  // MultiAirdrop hook
  const { requestAirdrops, results: airdropResults, loading: airdropLoading } = useMultiAirdrop();

  const { solana } = useUnifiedWallet();
  const connection = solana.connection;

  // Add this function:
  const refreshBalances = useCallback(() => {
    mutate();
    refetchNativeBalance();
    btcRefresh();
  }, [mutate, refetchNativeBalance, btcRefresh]);

  // Change handleShowBalances to:
  const handleShowBalances = useCallback(() => {
    setShowBalances(!showBalances);
    if (showBalances) {
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
      notifyError(`Failed to refresh network state: ${String(e)}`);
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
  const isRefreshingBalances = isStacksValidating || isSolLoading || btcLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={{ flex: 1 }}>
        {show &&
          <GlurryList setShow={setShow} />
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
                      source={headerLogo}
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
                      BitMeme
                    </Text>
                  </Animated.View>
                );
              }
              return (
                <Animated.Image
                  source={headerLogo}
                  style={[
                    style,
                    {
                      marginBottom: 6,
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
            <Button
              title={showBalances ? "Hide Balances" : "Show Balances"}
              onPress={handleShowBalances}
              disabled={isRefreshingBalances}
            />
          </Form.Section>
          {showBalances && (
            <BalancesSection
              stacksAddress={stacksAddress || ''}
              solanaAddress={solanaAddress || ''}
              onRefresh={refreshBalances}
              isRefreshing={isRefreshingBalances}
              balance={balance}
              nativeBalance={nativeBalance}
              spendableUTXOs={btcBalance}
            />
          )}
          {isDev && <Form.Section>
            <Button
              title={airdropLoading ? "Requesting Airdrops..." : "Request Airdrops"}
              onPress={handleAirdrop}
              disabled={airdropLoading}
            />
            {airdropResults.length > 0 && (
              <View style={{ marginTop: 12, }}>
                {airdropResults.map((result) => (
                  <Text key={result.address + result.type} style={{ color: AC.systemBlue }}>
                    {result.type.toUpperCase()} {result.address}: {result.status}
                  </Text>
                ))}
              </View>
            )}
          </Form.Section>}
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
              <TripleItem />
            </Form.HStack>
          </Form.Section>

          <AutoTipSwitch autoTipOn={autoTipOn} setAutoTipOn={setAutoTipOn} />
          {autoTipOn && hasHydrated && (
            <Segments value={tipCurrency} onValueChange={setTipCurrency}>
              <SegmentsList>
                <SegmentsTrigger value="STX">STX</SegmentsTrigger>
                <SegmentsTrigger value="SOL">SOL</SegmentsTrigger>
                <SegmentsTrigger value="BTC">BTC</SegmentsTrigger>
              </SegmentsList>
              {/* <Form.Text>Tip Amount in {tipCurrency === "STX" ? "STX" : tipCurrency === "SOL" ? "Lamports" : "sats"}</Form.Text> */}
              <SegmentsContent value="STX">
                <Form.Text>STX selected</Form.Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="Enter micro-payment amount"
                  label="Amount (in STX)"
                />
              </SegmentsContent>
              <SegmentsContent value="SOL">
                <Form.Text>SOL selected</Form.Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="Enter micro-payment amount"
                  label="Amount (in Lamports)"
                />
              </SegmentsContent>
              <SegmentsContent value="BTC">
                <Form.Text>BTC selected</Form.Text>
                <TextInput
                  keyboardType="decimal-pad"
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder="Enter micro-payment amount"
                  label="Amount (in sats)"
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

            {/* <View style={{ justifyContent: "center", alignSelf: "center" }}>
              {!rpcChecking && !rpcConnected && }
            </View> */}

            
              <RpcStatusSection
                rpcConnected={rpcConnected}
                rpcChecking={rpcChecking}
                onRefresh={checkRpcConnection}
              />
          

            <ContentUnavailable
              title="Bitcoin Wallet"
              systemImage="banknote"
              description={bitcoinAddress ? "Ready to receive tips!" : "No Bitcoin wallet found"}
            />
            
          </Form.Section>


          <Form.Section title="App Info">
            <Form.Text hint="BitMeme v1.0">Version</Form.Text>
            <Form.Text hint={`${process.env.EXPO_PUBLIC_APP_NETWORK}`}>App Network</Form.Text>
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
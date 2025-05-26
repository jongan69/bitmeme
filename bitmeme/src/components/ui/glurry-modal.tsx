import React, { useEffect } from "react";

import * as Form from "@/components/ui/Form";
import { IconSymbol } from "@/components/ui/IconSymbol";
import * as AC from "@bacons/apple-colors";
import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import TouchableBounce from "@/components/ui/TouchableBounce";
import { formatBitcoinAddress, formatSolanaAddress } from "@/utils/format";
import { handleCopy } from "@/utils/misc";
import { notifySuccess } from "@/utils/notification";
import Masked from "@react-native-masked-view/masked-view";
import { PublicKey } from "@solana/web3.js";
import { BlurView } from "expo-blur";
import {
  impactAsync,
  ImpactFeedbackStyle
} from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Stx from "@/svg/stx.svg";
import { useUnifiedWallet } from "@/contexts/UnifiedWalletProvider";


const ABlurView = Animated.createAnimatedComponent(BlurView);

function AnimateInBlur({
  intensity = 50,
  ...props
}: React.ComponentProps<typeof BlurView>) {
  "use no memo";
  const sharedValue = useSharedValue(0);

  React.useEffect(() => {
    sharedValue.set(
      withTiming(intensity || 50, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      })
    );
  }, [intensity]);
  // @ts-ignore
  React.useImperativeHandle(props.ref, () => ({
    animateToZero: () => {
      return new Promise<void>((resolve) => {
        sharedValue.value = withTiming(
          0,
          {
            duration: 500,
            easing: Easing.out(Easing.exp),
          },
          () => {
            runOnJS(resolve)();
          }
        );
      });
    },
  }));

  const animatedProps = useAnimatedProps(() => ({
    intensity: sharedValue.value,
  }));
  return <ABlurView {...props} animatedProps={animatedProps} />;
}

const backgroundImage =
  process.env.EXPO_OS === "web"
    ? `backgroundImage`
    : `experimental_backgroundImage`;

function Glur({ direction }: { direction: "top" | "bottom" }) {
  return (
    <>
      <GlurLayer direction={direction} falloff={50} intensity={12} />
      <GlurLayer direction={direction} falloff={75} intensity={12} />
      <GlurLayer direction={direction} falloff={100} intensity={12} />
    </>
  );
}

function GlurLayer({
  direction,
  falloff,
  intensity,
}: {
  direction: "top" | "bottom";
  falloff: number;
  intensity?: number;
}) {
  return (
    <>
      <Masked
        maskElement={
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              [backgroundImage]: `linear-gradient(to ${direction}, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) ${falloff}%)`,
            }}
          />
        }
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 96,
        }}
      >
        <BlurView intensity={intensity} style={StyleSheet.absoluteFill} />
      </Masked>
    </>
  );
}

function GloryModal({
  children,
  onClose,
}: {
  children?: React.ReactNode;
  onClose: () => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const ref = React.useRef<{ animateToZero: () => void }>(null);

  useEffect(() => {
    impactAsync(ImpactFeedbackStyle.Medium);
  }, []);

  const close = () => {
    ref.current?.animateToZero();
    onClose();
  };

  const theme = useColorScheme();

  return (
    <Modal
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      visible
      onRequestClose={close}
    >
      <Animated.View style={{ flex: 1 }} exiting={FadeOut}>
        <AnimateInBlur
          style={[StyleSheet.absoluteFill]}
          intensity={70}
          // @ts-ignore
          ref={ref}
          tint={
            process.env.EXPO_OS === "web"
              ? theme === "light"
                ? "systemThinMaterialLight"
                : "systemThickMaterialDark"
              : "systemThinMaterial"
          }
        />

        {children}

        {process.env.EXPO_OS !== "web" && (
          <Animated.View entering={FadeIn} exiting={FadeOutDown}>
            <Glur direction="bottom" />
          </Animated.View>
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            position: "absolute",
            bottom: 0,
            paddingHorizontal: 16,
            paddingBottom: bottom || 16,
            left: 0,
            right: 0,
          }}
        >
          <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
            <TouchableBounce sensory onPress={close}>
              <BlurView
                style={{
                  borderRadius: 16,
                  padding: 16,
                  overflow: "hidden",
                  borderWidth: 0.5,
                  borderColor: AC.separator,
                  borderCurve: "continuous",
                }}
              >
                <IconSymbol name="xmark" color={AC.label} size={24} />
              </BlurView>
            </TouchableBounce>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// Add a generic address truncation function
function formatAddress(addr: string | null | undefined): string {
  if (!addr) return "Unknown";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function GlurryList({ setShow }: { setShow: (show: boolean) => void }) {
  const { solana, bitcoin, stacks, ethereum, hyperevm, mnemonic } = useUnifiedWallet();
  const solanaWalletAddress = solana?.publicKey || '';
  const bitcoinAddress = bitcoin?.address || '';
  const stacksAddress = stacks?.address || '';
  const ethereumAddress = ethereum?.address || '';
  const hyperevmAddress = hyperevm?.address || '';
  const providers = [
    {
      title: "Bitcoin",
      icon: "https://simpleicons.org/icons/bitcoin.svg",
      color: "orange",
      selected: false,
      address: bitcoinAddress,
      format: formatAddress,
    },
    {
      title: "Solana",
      icon: "https://simpleicons.org/icons/solana.svg",
      color: "#4285F4",
      selected: false,
      address: solanaWalletAddress,
      format: formatAddress,
    },
    {
      title: "Stacks",
      icon: "https://simpleicons.org/icons/stacks.svg",
      color: "#4285F4",
      selected: false,
      address: stacksAddress,
      format: formatAddress,
    },
    {
      title: "Ethereum",
      icon: "https://simpleicons.org/icons/ethereum.svg",
      color: "#627eea",
      selected: false,
      address: ethereumAddress,
      format: formatAddress,
    },
    {
      title: "HyperEVM",
      icon: "https://avatars.githubusercontent.com/u/129421375?s=200&v=4",
      // color: "#ffb300",
      selected: false,
      address: hyperevmAddress,
      format: formatAddress,
    },
  ];

  const handleCopyAndToast = (value: string, label: string) => {
    handleCopy(value);
    notifySuccess(`${label} copied to clipboard`); 
  };

  return (
    <GloryModal onClose={() => setShow(false)}>
      <Animated.View
        entering={SlideInDown.duration(500).easing(Easing.out(Easing.exp))}
        exiting={SlideOutDown.easing(Easing.in(Easing.exp))}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setShow(false)}>
          <Form.List
            navigationTitle="Wallets"
            style={{
              transform: [{ scaleY: -1 }],
              backgroundColor: "transparent",
            }}
            contentContainerStyle={{
              justifyContent: "flex-end",
              transform: [{ scaleY: -1 }],
            }}
          >
            <View style={{ gap: 8 }}>
              {providers.map((provider) => (
                <TouchableBounce
                  sensory
                  key={provider.title}
                  onPress={() => {
                    handleCopyAndToast(provider.address, provider.title);
                    setShow(false);
                  }}
                >
                  <Form.HStack
                    key={provider.title}
                    style={{
                      gap: 16,
                      marginHorizontal: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 16,
                      borderRadius: 16,
                      backgroundColor: provider.selected
                        ? `rgba(0, 0, 0, 0.05)`
                        : "transparent",
                    }}
                  >
                    {provider.title === "Stacks" ? (
                      <Stx
                        width={24}
                        height={24}
                        style={{
                          aspectRatio: 1,
                          height: 24,
                        }}
                      />
                    ) : (
                      <Image
                        source={{ uri: provider.icon }}
                        tintColor={provider.color}
                        style={{
                          tintColor: provider.color,
                          aspectRatio: 1,
                          height: 24,
                        }}
                      />
                    )}
                    <View style={{ gap: 4 }}>
                      <Form.Text style={Form.FormFont.default}>
                        {provider.title}
                      </Form.Text>
                      <Form.Text 
                        style={[Form.FormFont.default, { fontSize: 12, color: "#888" }]}
                      >
                        {provider.format(provider.address)}
                      </Form.Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    {provider.selected && (
                      <IconSymbol
                        color={AC.label}
                        name="checkmark.circle.fill"
                        weight="bold"
                        size={24}
                      />
                    )}
                  </Form.HStack>
                </TouchableBounce>
              ))}
            </View>
          </Form.List>
        </Pressable>
      </Animated.View>
    </GloryModal>
  );
}

import * as Form from "@/components/ui/Form";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSolanaWallet } from "@/contexts/SolanaWalletProvider";
import * as AC from "@bacons/apple-colors";
import { useUser } from "@clerk/clerk-expo";
import * as Application from "expo-application";
import * as Clipboard from 'expo-clipboard';
import * as React from "react";
import { Animated, Image, Platform, View } from "react-native";

export default function Page() {
  const { exportPrivateKey } = useSolanaWallet();
  const { user } = useUser();

  // Toast state and handler
  const [toast, setToast] = React.useState<{ visible: boolean, message: string, type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 1500);
  }

  const handleExport = async () => {
    try {
      const key = await exportPrivateKey();
      if (key) {
        Clipboard.setStringAsync(key);
        showToast('Solana private key copied!', 'success');
      } else {
        showToast('Failed to export private key', 'error');
      }
    } catch (e) {
      showToast('Failed to export private key: ' + e, 'error');
    }
  };
  return (
    <>
      <TopToast visible={toast.visible} message={toast.message} type={toast.type} />
      <Form.List navigationTitle="Account">
        <Form.Section>
          <Form.HStack style={{ gap: 12 }}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${user?.emailAddresses[0].emailAddress}` }}
              style={{
                aspectRatio: 1,
                height: 48,
                borderRadius: 999,
              }}
            />
            <View style={{ gap: 4 }}>
              <Form.Text style={Form.FormFont.default}>{user?.emailAddresses[0].emailAddress}</Form.Text>
              {/* <Form.Text style={Form.FormFont.caption}>Today</Form.Text> */}
            </View>
          </Form.HStack>
          <Form.Link
            href="/account"
            hint=""
            systemImage={{ name: "key.fill", color: AC.systemPink }}
            onPress={handleExport}
          >
            Export Solana Public Key
          </Form.Link>
        </Form.Section>

        {/* <Form.Section>
          <Form.Link href="/">Apps</Form.Link>
          <Form.Link href="/">Subscriptions</Form.Link>
          <Form.Link href="/">Purchase History</Form.Link>
          <Form.Link href="/">Notifications</Form.Link>
        </Form.Section> */}

        {/* <Form.Section>
          <Form.Text style={{ color: AC.link }} onPress={() => {}}>
            Redeem Gift Card or Code
          </Form.Text>
          <Form.Text style={{ color: AC.link }} onPress={() => {}}>
            Send Gift Card by Email
          </Form.Text>
          <Form.Text style={{ color: AC.link }} onPress={() => {}}>
            Add Money to Account
          </Form.Text>
        </Form.Section> */}

        {/* <Form.Section>
          <Form.Link href="/">Personalized Recommendations</Form.Link>
        </Form.Section> */}

        {/* <Form.Section title="Upcoming automatic updates">
          <Form.Text hint="3">Update All</Form.Text>

          <AppUpdate icon="https://github.com/expo.png" name="Expo Go" />
          <AppUpdate icon="https://github.com/facebook.png" name="Facebook" />
          <AppUpdate icon="https://github.com/apple.png" name="Apple" />
        </Form.Section> */}

        <SettingsInfoFooter />
      </Form.List>
    </>
  );
}

function AppUpdate({ name, icon }: { name: string; icon: string }) {
  return (
    <View style={{ gap: 16, flex: 1 }}>
      <Form.HStack style={{ gap: 16 }}>
        <Image
          source={{ uri: icon }}
          style={{
            aspectRatio: 1,
            height: 48,
            borderRadius: 12,
          }}
        />
        <View style={{ gap: 4 }}>
          <Form.Text style={Form.FormFont.default}>{name}</Form.Text>
          <Form.Text style={Form.FormFont.caption}>Today</Form.Text>
        </View>

        <View style={{ flex: 1 }} />

        <IconSymbol
          color={AC.systemBlue}
          name="icloud.and.arrow.down"
          weight="bold"
          size={24}
        />
      </Form.HStack>
      <Form.Text>- Minor bug-fixes</Form.Text>
    </View>
  );
}

function SettingsInfoFooter() {
  const name = `${Application.applicationName} for ${Platform.select({
    web: "Web",
    ios: `iOS v${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`,
    android: `Android v${Application.nativeApplicationVersion} (${Application.nativeBuildVersion})`,
  })}`;
  return (
    <View
      style={{ padding: 12, alignItems: "center", justifyContent: "center" }}
    >
      <Form.Text
        style={{
          textAlign: "center",
          fontSize: 12,
          color: AC.secondaryLabel,
        }}
      >
        {name}
      </Form.Text>
    </View>
  );
}

function TopToast({ visible, message, type }: { visible: boolean, message: string, type: 'success' | 'error' }) {
  const [show, setShow] = React.useState(visible);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-30)).current;

  React.useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 10,
        opacity,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View style={{
        backgroundColor: type === 'success' ? 'rgba(40,200,120,0.95)' : 'rgba(220,60,60,0.95)',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        minWidth: 160,
      }}>
        <Form.Text style={{
          color: 'white',
          fontWeight: '600',
          fontSize: 16,
          textAlign: 'center',
          letterSpacing: 0.2,
        }}>
          {message}
        </Form.Text>
      </View>
    </Animated.View>
  );
}

import { memo } from "react";
import { View } from "react-native";
import * as Form from "@/components/ui/Form";
import { Image } from "react-native";
import TouchableBounce from "@/components/ui/TouchableBounce";
import Icon from "@/components/ui/Icons";
import Logo from "@/images/logo.png";

export const BalancesSection = memo(function BalancesSection({
    onRefresh,
    isRefreshing,
    balance,
    nativeBalance,
    spendableUTXOs,
  }: {
    stacksAddress: string;
    solanaAddress: string;
    onRefresh: () => void;
    isRefreshing: boolean;
    balance: any;
    nativeBalance: any;
    spendableUTXOs: any;
  }) {
    return (
      <Form.Section>
        <View style={{ alignItems: "center", gap: 8, padding: 16, flex: 1, width: '100%' }}>
          <Image
            source={Logo}
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
                STX balance: {balance?.toString()} STX
              </Form.Text>
              <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
                SOL balance: {nativeBalance.lamports} Lamports
              </Form.Text>
              <Form.Text style={{ textAlign: "center", fontSize: 14 }}>
                BTC balance: {spendableUTXOs} sats
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
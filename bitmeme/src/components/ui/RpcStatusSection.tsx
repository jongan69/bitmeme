import { memo } from "react";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { Button } from "react-native";

export const RpcStatusSection = memo(function RpcStatusSection({
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
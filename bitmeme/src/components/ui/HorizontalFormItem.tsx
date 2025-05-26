import { memo } from "react";
import { View } from "react-native";
import * as Form from "@/components/ui/Form";
import * as AC from "@bacons/apple-colors";

export const HorizontalFormItem = memo(function HorizontalItem({
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
  });
  
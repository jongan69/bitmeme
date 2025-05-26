import React, { memo } from "react";
import { View } from "react-native";
import * as Form from "@/components/ui/Form";
import * as AC from "@bacons/apple-colors";
import { IconSymbol } from "@/components/ui/IconSymbol";

export const FormExpandable = memo(function FormExpandable({
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
  });
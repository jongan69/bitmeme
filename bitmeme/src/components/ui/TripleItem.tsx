import React, { memo } from "react";
import { View } from "react-native";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { HorizontalFormItem } from "@/components/ui/HorizontalFormItem";
import * as AC from "@bacons/apple-colors";

export const TripleItem = memo(function TripleItem() {
    return (
      <>
        <HorizontalFormItem title="Launched" badge="May" subtitle="2025" />
  
        <View
          style={{
            backgroundColor: AC.separator,
            width: 0.5,
            maxHeight: "50%",
            minHeight: "50%",
            marginVertical: "auto",
          }}
        />
  
        <HorizontalFormItem
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
  
        <HorizontalFormItem title="Version" badge="v1.0" subtitle="Initial Release" />
      </>
    );
  });
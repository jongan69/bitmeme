import { memo } from "react";
import { Switch } from "react-native";
import * as Form from "@/components/ui/Form";

export const AutoTipSwitch = memo(function AutoTipSwitch({ autoTipOn, setAutoTipOn }: { autoTipOn: boolean; setAutoTipOn: (value: boolean) => void }) {
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
});
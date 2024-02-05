import React, { useContext } from "react";
import { SettingsContext } from "@/context/settings-context";
import { Title, Text, Divider, NativeSelect, Textarea, Switch, Drawer } from "@mantine/core";

/**
 * SettingsPanel props.
 *
 * @interface SettingsPanelProps
 * @typedef {SettingsPanelProps}
 *
 * @property {boolean} opened - Whether to show the settings panel.
 * @property {() => void} close - Function to close the settings panel.
 */
interface SettingsPanelProps {
    opened: boolean;
    close: () => void;
}

/**
 * A component to display a settings panel that relies on the SettingsContext.
 *
 * @param {SettingsPanelProps} props - SettingsPanel props, see {@link SettingsPanelProps}.
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ opened, close }) => {
    const [settings, dispatch] = useContext(SettingsContext);

    // Set model to use.
    const setModel = (model: string) => {
        dispatch({
            type: "SET_MODEL",
            payload: model
        });
    };

    // Prompt components, used to determine what information to use when generating suggestions.
    // Note the "action" properties here, which are used to determine which action to dispatch when the corresponding switch is toggled.
    const promptComponents = [
        { label: "Figure Text", value: "figure.text", enabled: settings.shouldUseFigureText, action: "SET_USE_FIGURE_TEXT" },
        { label: "Figure Caption", value: "figure.caption", enabled: settings.shouldUseFigureCaption, action: "SET_USE_FIGURE_CAPTION" },
        { label: "Figure Mentions", value: "figure.mentions", enabled: settings.shouldUseFigureMentions, action: "SET_USE_FIGURE_MENTIONS" },
        { label: "Extracted Data", value: "data.table", enabled: settings.shouldUseDataTable, action: "SET_USE_DATA_TABLE" }
    ];

    return (
        <Drawer
            opened={opened}
            onClose={close}
            position={"right"}
        >
            <Title>{"Settings"}</Title>
            <Divider mt={"xs"} mb={"xl"}/>
            <Text>{"Model"}</Text>
            <NativeSelect
                data={[
                    { value: "gpt-4-0613", label: "GPT-4" },
                    { value: "gpt-3.5-turbo-0613", label: "GPT-3.5 Turbo" }
                ]}
                value={settings.model}
                onChange={(event) => setModel(event.currentTarget.value)}
            />
            <Text size={"sm"} color={"gray"}>{"GPT-4 is slower but more accurate."}</Text>
            <Divider mt={"xs"} mb={"xl"}/>
            <Text>{"Custom Prompt"}</Text>
            <Textarea
                value={settings.customPrompt}
                onChange={(event) => {
                    dispatch({
                        type: "SET_CUSTOM_PROMPT",
                        payload: event.currentTarget.value
                    });
                }}
            />
            <Text size={"sm"} color={"gray"}>{"Custom prompt to use when generating text. Use this, for example, to request more specific suggestions."}</Text>
            <Divider mt={"xs"} mb={"xl"}/>
            <Text>{"Prompt Components"}</Text>
            {promptComponents.map((component, index) => (
                <Switch
                    key={index}
                    label={component.label}
                    checked={component.enabled}
                    onChange={(event) => {
                        dispatch({
                            type: component.action,
                            payload: event.currentTarget.checked
                        });
                    }}
                    py={"xs"}
                    color={"#1B4596"}
                >
                    {component.label}
                </Switch>
            ))}
            <Text size={"sm"} color={"gray"}>
                {"Use these settings to determine what information is used to make suggestions."}
                {"For example, if the recognized text is highly inaccurate or seems unhelpful, you can turn it off and it will not be factored into future suggestions."}
            </Text>
        </Drawer>
    );
};

export default SettingsPanel;

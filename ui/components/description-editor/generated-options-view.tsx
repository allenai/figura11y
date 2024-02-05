import React from "react";
import { Title, Text, Spoiler, Button, Group, Tabs } from "@mantine/core";

/**
 * GeneratedOptionsView props.
 *
 * @interface GeneratedOptionsViewProps
 * @typedef {GeneratedOptionsViewProps}
 *
 */
interface GeneratedOptionsViewProps {
    options: {
        model: string;
        text: string;
    }[];
    generate?: () => void;
}

/**
 * A component to display and allow the user to select from a set of generated figure description options.
 *
 * @param {GeneratedOptionsViewProps} props - Props containing the options and corresponding model names.
 */
const GeneratedOptionsView: React.FC<GeneratedOptionsViewProps> = ({
    options,
    generate
}) => {
    return (
        <Spoiler
            maxHeight={120}
            hideLabel={"Show less"}
            showLabel={"Show more"}
            p={"sm"}
            style={{
                border: "solid",
                borderRadius: 8,
                borderColor: "lightgray"
            }}
        >
            <Group position={"apart"}>
                <Title order={5}>{"Generated Options"}</Title>
                <Button
                    size={"xs"}
                    color={"dark"}
                    variant={"outline"}
                    onClick={generate}
                    compact
                >
                        {"Generate"}
                </Button>
                <Text size={"sm"} color={"gray"}>{"You may use text from these generated description options in your description."}</Text>
            </Group>
            <Tabs defaultValue={"gpt-4-0613"}>
                <Tabs.List>
                    {options.map((option, i) => (
                        <Tabs.Tab key={i} value={option.model}>
                            {`Option ${i + 1} (${option.model.replace("gpt", "GPT").replace("-0613", "")})`}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
                {
                    options.map((option, i) => (
                        <Tabs.Panel key={i} value={option.model} pt={"xs"}>
                            <Text size={"sm"}>{option.text}</Text>
                        </Tabs.Panel>
                    ))
                }
            </Tabs>
        </Spoiler>
    );
};

export default GeneratedOptionsView;

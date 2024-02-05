import React, { useEffect, useState } from "react";
import { Title, Text, Textarea, Stack, Button, Group } from "@mantine/core";

/**
 * TextGenerator props.
 *
 * @interface TextGeneratorProps
 * @typedef {TextGeneratorProps}
 *
 */
interface TextGeneratorProps {
    model: string;
}

/**
 * A component to interactively generate text.
 *
 * @param {TextGeneratorProps} props - Props containing the options and corresponding model names.
 */
const TextGenerator: React.FC<TextGeneratorProps> = ({
    model
}) => {
    const [prompt, setPrompt] = useState<string>("");
    const [text, setText] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const generateText = () => {
        if (prompt.length) {
            setIsGenerating(true);
            fetch(
                "/api/generate",
                {
                    method: "POST",
                    body: JSON.stringify({
                        model,
                        prompt
                    })
                }
            ).then(
                (response) => response.json()
            ).then(
                (data) => {
                    setText(data.result);
                    setIsGenerating(false);
                }
            );
        }
    };

    useEffect(() => {
        if (isGenerating) {
            document.body.style.cursor = "wait";
        } else {
            document.body.style.cursor = "default";
        }
    }, [isGenerating]);

    return (
        <Stack>
            <Group position={"apart"}>
                <Title order={5}>{"Generate Text"}</Title>
                <Text size={"sm"} color={"gray"}>{"You may use this section to generate new text to add to your description."}</Text>
            </Group>
            <Textarea
                placeholder={"Type your prompt here..."}
                radius={"sm"}
                value={prompt}
                label={"Prompt"}
                onChange={(event) => setPrompt(event.currentTarget.value)}
                autosize
            />
            {(text && text.length) ? <Text size={"sm"}><b>{"Response: "}</b>{text}</Text> : null}
            <Button
                onClick={generateText}
                disabled={!prompt.length || isGenerating}
                radius={"sm"}
                compact
                bg={"dark"}
                color={"white"}
            >
                {"Generate"}
            </Button>
        </Stack>
    );
};

export default TextGenerator;

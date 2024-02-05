import React, { useEffect } from "react";
import { Modal, Image, Group, Button, CopyButton, Textarea, Text } from "@mantine/core";
import AsyncDataView from "@/components/async-data";
import { useAsyncRequest } from "@/lib/requests";

/**
 * SummaryModal props.
 *
 * @interface SummaryModalProps
 * @typedef {SummaryModalProps}
 *
 * @property {?string} text - The current figure description (marked done).
 * @property {?*} figure - The figure and its contextual data.
 * @property {boolean} opened - Whether the modal should be shown.
 * @property {() => void} onClose - What to do when the modal is closed.
 * @property {string} model - The model to use for summarization.
 * @property {string} customPrompt - The custom prompt to use for summarization.
 * @property {number} figureHeight - The height of the displayed figure image in the modal.
 */
interface SummaryModalProps {
    text?: string;
    figure?: any;
    opened: boolean;
    onClose: (summarizedDescription: string | null) => void;
    model: string;
    customPrompt: string;
    initialSummarizedDescription: string | null;
    figureHeight: number;
}

/**
 * A modal to display a figure and its description, and to summarize the description.
 * It contains the figure and description, presented for the author to review.
 * It also contains a button to summarize the description into a brief version.
 *
 * @param {SummaryModalProps} props - Props containing the figure, its description, the modal's state, and parameters for summarization requests.
 */
const SummaryModal: React.FC<SummaryModalProps> = ({
    text,
    figure,
    opened,
    onClose,
    model,
    customPrompt,
    initialSummarizedDescription = null,
    figureHeight = 300
}) => {
    const summarizedDescription = useAsyncRequest<string | null>({
        defaultValue: null,
        apiCall: () => fetch("/api/abbreviation", {
                method: "POST",
                body: JSON.stringify({
                    description: text,
                    model,
                    customPrompt
                })
            }).then((res) => res.json())
            .then((data) => data.result),
        dependencies: [
            text,
            model,
            customPrompt
        ],
        autoFetch: false
    });

    useEffect(() => {
        summarizedDescription.setData(initialSummarizedDescription);
    }, [initialSummarizedDescription]);

    return (
        <Modal
            opened={opened}
            onClose={() => onClose(summarizedDescription.data)}
            size={"xl"}
            title={"Figure Description"}
            mih={"80vh"}
        >
            <Image
                src={`data:image/png;base64,${figure.base64_encoded}`}
                alt={text}
                height={figureHeight}
                fit={"contain"}
                style={{
                    overflow: "scroll"
                }}
            />
            <CopyButton value={text || ""} timeout={2000}>
                {({ copied, copy }) => (
                    <>
                        <Text size={"sm"}><b>{"Figure Description: "}</b></Text>
                        <Text
                            size={"sm"}
                            align={"justify"}
                            bg={copied ? "#FFC10740" : "transparent"}
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {text}
                        </Text>
                        <Button
                            bg={copied ? "teal" : "dark"}
                            size={"xs"}
                            mt={"sm"}
                            compact
                            onClick={copy}
                        >
                            {copied ? "Copied!" : "Click to Copy"}
                        </Button>
                    </>
                )}
            </CopyButton>
            <Group position={"center"} pt={"lg"} pb={"xl"}>
                <Button
                    variant={"gradient"}
                    gradient={{ from: "blue", to: "teal" }}
                    size={"xs"}
                    onClick={() => summarizedDescription.fetchData()}
                >
                    {"Summarize Description"}
                </Button>
            </Group>
            <AsyncDataView
                data={summarizedDescription}
                messageLoading={"Summarizing Description"}
                messageError={"Error Summarizing Full Description"}
                view={(summarizedDescriptionData) => (
                    <CopyButton value={summarizedDescriptionData.data || ""} timeout={2000}>
                        {({ copied, copy }) => (
                            <>
                                <Text size={"sm"}><b>{"Summarized Description: "}</b></Text>
                                <Textarea
                                    value={summarizedDescriptionData.data}
                                    onChange={
                                        (event) => summarizedDescription.setData(
                                            event.currentTarget.value
                                        )
                                    }
                                    autosize
                                    bg={copied ? "#FFC10740" : "transparent"}
                                />
                                <Button
                                    bg={copied ? "teal" : "dark"}
                                    size={"xs"}
                                    mt={"sm"}
                                    compact
                                    onClick={copy}
                                >
                                    {copied ? "Copied!" : "Click to Copy"}
                                </Button>
                            </>
                        )}
                    </CopyButton>
                )}
            />
            <Group position={"center"} pt={"lg"} pb={"xl"}>
                <Button
                    variant={"gradient"}
                    gradient={{ from: "blue", to: "teal" }}
                    size={"xs"}
                    onClick={() => onClose(summarizedDescription.data)}
                >
                    {"Done"}
                </Button>
            </Group>
        </Modal>
    );
};

export default SummaryModal;

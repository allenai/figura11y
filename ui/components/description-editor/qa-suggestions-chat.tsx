import React, { useRef, useEffect } from "react";
import { Card, Group, Kbd, Tooltip, Paper, CopyButton, ScrollArea, Title, Text } from "@mantine/core";
import { useMetaKeySymbol } from "@/hooks";
import { QAPair } from "@/lib/types";
import { UseAsyncRequestResult } from "@/lib/requests";

/**
 * QASuggestionsView props.
 *
 * @interface QASuggestionsViewProps
 * @typedef {QASuggestionsViewProps}
 *
 * @property {UseAsyncRequestResult<QAPair[]>} questions - The Q&A data wrapper.
 * @property {QAPair[]} allQuestions - List of all (cumulative) Q&A pairs so far.
 */
interface QASuggestionsViewProps {
    questions: UseAsyncRequestResult<QAPair[]>;
    allQuestions: QAPair[];
}

/**
 * A component to display Q&A suggestions.
 * It contains the questions and suggested answers, presented in a scrollable list.
 *
 * @param {QASuggestionsViewProps} props - Props containing the Q&A data wrapper and the list of all (cumulative) Q&A pairs so far.
 */
const QASuggestionsChat: React.FC<QASuggestionsViewProps> = ({ questions, allQuestions }) => {
    const metaKeySymbol = useMetaKeySymbol();
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        scrollRef.current?.scrollTo(
            {
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            }
        );
    };

    useEffect(() => scrollToBottom(), [allQuestions.length]);

    const timeOrderedQuestions = allQuestions.filter((qa: QAPair, i: number) => {
        const { question, suggested_answer1 } = qa;
        return allQuestions.findIndex(
            (q: QAPair) => q.question === question && q.suggested_answer1 === suggested_answer1
        ) === i;
    });

    return (
        <Card shadow={"sm"} padding={"sm"} radius={"sm"} style={{ height: "100%" }}>
            <Card.Section bg={"dark"} p={"sm"} style={{ borderBottom: "1px solid #ebebeb" }}>
                <Title order={5} color={"white"}><b>{"Potential User Questions"}</b></Title>
                <Text size={"sm"} color={"lightgray"}>
                    {"Questions highlight aspects of the figure that might be unclear from your current description."}
                    <Kbd p={2} m={0} ml={2} pt={2} size={"sm"}>{`${metaKeySymbol}+/`}</Kbd>{" to request a new question."}
                </Text>
            </Card.Section>
            <ScrollArea
                h={300}
                type={"always"}
                mr={-10}
                pr={10}
                viewportRef={scrollRef}
            >
                {timeOrderedQuestions.map((qa: QAPair, i: number) => (
                    <Paper key={i}>
                        <Paper shadow={"sm"} p={"sm"} mb={"sm"} mt={"lg"} bg={"#1B4596"} radius={"sm"} style={{ maxWidth: "80%", width: "100%" }}>
                            <Text size={"sm"} color={"#FFBB00"}>
                                <b>{"Q: "}</b><i>{qa.question}</i>
                            </Text>
                        </Paper>
                        <Group position={"right"} grow>
                            <br/>
                            {
                                [1, 2, 3, 4].map((answernum: number) => {
                                    const key = `suggested_answer${answernum}`;
                                    const value = qa[key as keyof QAPair];
                                    if (!value) {
                                        return null;
                                    }
                                    return (
                                        <CopyButton value={value} key={answernum} timeout={2000}>
                                            {({ copied, copy }) => (
                                                <Tooltip
                                                    label={
                                                        <Text
                                                            size={"xs"}
                                                            color={"white"}
                                                            style={{ whiteSpace: "pre-wrap" }}
                                                        >
                                                            {copied ? "Copied!" : "Click to Copy"}
                                                        </Text>
                                                    }
                                                    pr={"xl"}
                                                    position={"top"}
                                                >
                                                    <Paper
                                                        shadow={"sm"}
                                                        p={"sm"}
                                                        radius={"sm"}
                                                        onClick={copy}
                                                        bg={copied ? "#1B4596" : "#ebebeb"}
                                                    >
                                                        <Text size={"xs"} color={"gray"}>
                                                            <i>{value}</i>
                                                        </Text>
                                                    </Paper>
                                                </Tooltip>
                                            )}
                                        </CopyButton>
                                    );
                                })
                            }
                        </Group>
                    </Paper>
                ))}
            </ScrollArea>
        </Card>
    );
};

export default QASuggestionsChat;

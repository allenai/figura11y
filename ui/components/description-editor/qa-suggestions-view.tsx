import React from "react";
import { ScrollArea, Text } from "@mantine/core";
import AsyncDataView from "@/components/async-data";
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
const QASuggestionsView: React.FC<QASuggestionsViewProps> = ({ questions, allQuestions }) => {
    return (
        <ScrollArea variant={"vertical"} h={400}>
            {/*
                Currently, we only show any suggestions if the currently-requested set has loaded.
                This is because we don't want to keep showing stale suggestions if the user has requested new ones.

                TODO: visually differentiate previous from current suggestions to show both.
            */}
            <AsyncDataView
                data={questions}
                messageLoading={"Requesting Suggestions"}
                messageError={"Error Requesting New Suggestions"}
                view={() => (
                    <>
                        {allQuestions.length ? <Text size={"sm"}><b>{"Suggestions"}</b></Text> : null}
                        {allQuestions.map((qa: QAPair, i: number) => (
                            <Text key={i} size={"sm"} pb={"sm"}>
                                <b>{"Question: "}</b> <i>{qa.question}</i>
                                <br/>
                                <span style={{ color: "gray" }}><i>{"Suggested Answer: "}</i> {qa.suggested_answer}</span>
                            </Text>
                        ))}
                    </>
                )}
            />
        </ScrollArea>
    );
};

export default QASuggestionsView;

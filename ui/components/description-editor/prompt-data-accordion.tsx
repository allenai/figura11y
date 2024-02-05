import React, { useState, useEffect } from "react";
import { Accordion, Highlight, Group, NativeSelect, Anchor, Text } from "@mantine/core";
import { Figure } from "@/lib/db-schema";
import { GuidelineService, GUIDELINES } from "@/lib/guidelines";
import { useFigureStore } from "@/hooks/store";

/**
 * List of figure types we support (with "other" lightly supported).
 *
 * @type {string[]}
 */
const FIGURE_TYPES = [
    "Area chart",
    "Bar plots",
    "Block diagram",
    "Box plot",
    "Bubble chart",
    "Confusion matrix",
    "Flow chart",
    "Line plot",
    "Histogram",
    "Pareto charts",
    "Pie chart",
    "Polar plot",
    "Radar chart",
    "Scatter plot",
    "Sketches",
    "Tree Diagram",
    "Venn Diagram",
    "Other"
];

/**
 * PromptDataAccordion props.
 * @date 8/29/2023 - 11:57:41 AM
 *
 * @interface PromptDataAccordionProps
 * @typedef {PromptDataAccordionProps}
 *
 * @property {Figure} figure - The figure data.
 */
interface PromptDataAccordionProps {
    figure: Figure;
}

/**
 * A component to display the contextual information for a figure.
 * It contains the caption, mentions, recognized text, and extracted data.
 * This is useful for the author to reference when writing the description.
 * It also allows the user to decide whether or not to include these elements in the suggestion prompt.
 *
 * @param {PromptDataAccordionProps} props - Props containing the figure data.
 */
const PromptDataAccordion: React.FC<PromptDataAccordionProps> = ({ figure }) => {
    const HIGHLIGHT_PATTERN = /\bFig(?:ure)?s?\.?\s?\w*(\d+)\b/gi;
    const captionMatch = Array.from(figure.caption.matchAll(HIGHLIGHT_PATTERN) || []);
    const captionFigureNumber = captionMatch[0][1];

    const captionMatches = [captionMatch[0][0]];
    const mentionsMatches = Array.from(
        figure.mentions_paragraphs.matchAll(HIGHLIGHT_PATTERN) || []
    ).filter((match) => match[1] === captionFigureNumber).map((match) => `${match[0]}`);

    const guidelines = (new GuidelineService(GUIDELINES)).getGuidelines(figure.figure_type);

    const [selectedFigureType, setSelectedFigureType] = useState<string | null>(figure.figure_type);

    const initializeFigure = useFigureStore((state) => state.initialize);

    useEffect(() => {
        setSelectedFigureType(figure.figure_type);
    }, [figure.figure_type]);

    useEffect(() => {
        if (selectedFigureType) {
            const isPlot = (selectedFigureType !== "Flow chart") &&
                ["chart", "plot", "histogram"].some(type => selectedFigureType.toLowerCase().includes(type));
            const needsData = isPlot && (!figure.data_table || !figure.data_table.length);
            const needsRemoveData = !isPlot && (
                (figure.data_table !== null) && (figure.data_table.length > 0)
            );
            initializeFigure(
                {
                    ...figure,
                    figure_type: selectedFigureType,
                    data_table: needsRemoveData ? undefined : figure.data_table
                },
                needsData || needsRemoveData
            );
        }
    }, [selectedFigureType]);

    return (
        <Accordion defaultValue={"caption"} style={{ borderRadius: 8 }}>
            <Group position={"center"}>
                <Text align={"center"} py={"sm"}>
                    <b>{"Figure Type: "}</b>
                </Text>
                <NativeSelect
                    data={FIGURE_TYPES}
                    value={selectedFigureType || "Other"}
                    onChange={(event) => {
                        setSelectedFigureType(event.currentTarget.value);
                    }}
                />
            </Group>
            <Accordion.Item value={"caption"} style={{ border: "solid", borderRadius: 8 }}>
                <Accordion.Control>{"Caption"}</Accordion.Control>
                <Accordion.Panel>
                    <Highlight
                        size={"sm"}
                        highlight={captionMatches}
                        highlightStyles={() => ({
                            whiteSpace: "pre-wrap",
                            fontWeight: 700 // TODO: make this configurable.
                        })}
                    >
                        {figure.caption}
                    </Highlight>
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value={"mentions"} style={{ border: "solid", borderRadius: 8 }}>
                <Accordion.Control>{"Mentions"}</Accordion.Control>
                <Accordion.Panel>
                    <Highlight
                        size={"sm"}
                        highlight={mentionsMatches}
                        highlightStyles={() => ({
                            whiteSpace: "pre-wrap",
                            fontWeight: 700 // TODO: make this configurable.
                        })}
                    >
                        {figure.mentions_paragraphs}
                    </Highlight>
                </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value={"figuretext"} style={{ border: "solid", borderRadius: 8 }}>
                <Accordion.Control>{"Recognized Text"}</Accordion.Control>
                <Accordion.Panel>
                    <Text size={"xs"} style={{ whiteSpace: "pre-wrap" }}>
                        {figure.ocr_text}
                    </Text>
                </Accordion.Panel>
            </Accordion.Item>
            {/* The data table is only present on plot figure types. */}
            {(figure.data_table && figure.data_table.length) ? (
                <Accordion.Item value={"datatable"} style={{ border: "solid", borderRadius: 8 }}>
                    <Accordion.Control>{"Extracted Data"}</Accordion.Control>
                    <Accordion.Panel>
                        <Text size={"xs"} style={{ whiteSpace: "pre-wrap" }}>
                            {figure.data_table}
                        </Text>
                    </Accordion.Panel>
                </Accordion.Item>
            ) : null}
            <Accordion.Item value={"guidelines"} style={{ border: "solid", borderRadius: 8 }}>
                <Accordion.Control>{"Description Guidelines"}</Accordion.Control>
                <Accordion.Panel>
                    <Text size={"sm"} style={{ whiteSpace: "pre-wrap" }}>
                        <ul>
                            {guidelines.split("\n").map((guideline, index) => (
                                <li key={index}>{guideline}</li>
                            ))}
                        </ul>
                    </Text>
                    <Text
                        size={"md"}
                        color={"gray"}
                        align={"center"}
                        style={{ whiteSpace: "pre-wrap" }}
                    >
                        {"Adapted from "}
                        <Anchor
                            href={"http://diagramcenter.org/table-of-contents-2.html"}
                            target={"_blank"}
                        >
                            {"the DIAGRAM Center's Image Description Guidelines"}
                        </Anchor>
                        {"."}
                    </Text>
                </Accordion.Panel>
            </Accordion.Item>
        </Accordion>
    );
};

export default PromptDataAccordion;

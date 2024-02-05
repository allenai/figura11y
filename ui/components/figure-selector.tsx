import React, { useEffect, useState } from "react";
import { Modal, Card, Center, Pagination, Title, Text, NativeSelect, Highlight, Image, Button } from "@mantine/core";
import { Figure } from "@/lib/db-schema";
import { useFigureStore } from "@/hooks/store";
import AsyncDataView from "@/components/async-data";
import { UseAsyncRequestResult } from "@/lib/requests";

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
 * FigureSelector props.
 *
 * @interface FigureSelectorProps
 * @typedef {FigureSelectorProps}
 *
 * @property {UseAsyncRequestResult<Partial<Figure>[]>} figures - List of figures to choose from (caption and mentions_paragraphs included).
 * @property {number} activePage - The currently shown figure.
 * @property {(page: number) => void} setPage - Function to set the currently shown figure.
 * @property {(figure: Partial<Figure>) => void} setSelectedFigure - Function to set the selected figure.
 * @property {boolean} opened - Whether the modal is opened.
 * @property {() => void} open - Function to open the modal.
 * @property {() => void} close - Function to close the modal.
 */
interface FigureSelectorProps {
    figures: UseAsyncRequestResult<Partial<Figure>[]>;
    activePage: number;
    setPage: (page: number) => void;
    setSelectedFigure: (figure: Partial<Figure>) => void;
    opened: boolean;
    open: () => void;
    close: () => void;
}

/**
 * A component to display a modal to select a figure from a list of figures, typically those extracted from a PDF.
 * It will display the figure, the (machine detected) figure type, and the caption and mentions_paragraphs of the figure.
 *
 * @param {FigureSelectorProps} props - Props containing the list of figures, the displayed figure state, and functions to set the displayed figure and selected figure.
 */
const FigureSelector: React.FC<FigureSelectorProps> = ({
    figures,
    activePage,
    setPage,
    setSelectedFigure,
    opened,
    open,
    close
}) => {
    if (!figures.data || !figures.data.length) return null;

    // Logic to highlight the figure number (with the preceding identifier such as "Fig." or "Figure") in the caption and mentions_paragraphs.
    const HIGHLIGHT_PATTERN = /\bFig(?:ure)?s?\.?\s?\w*(\d+)\b/gi;
    const captionMatch = Array.from(
        figures.data[activePage - 1]?.caption?.matchAll(HIGHLIGHT_PATTERN) || []
    );
    const captionFigureNumber = captionMatch[0][1]; // The first match is the figure with the number, from the caption.

    // Now we look for mentions_paragraphs of the figure (with the same number) in the mentions_paragraphs paragraphs.
    const captionMatches = [captionMatch[0][0]];
    const mentions_paragraphsMatches = Array.from(figures.data[activePage - 1]
        ?.mentions_paragraphs
        ?.matchAll(HIGHLIGHT_PATTERN) || []
    ).filter((match) => match[1] === captionFigureNumber).map((match) => `${match[0]}`);

    const figure = figures.data[activePage - 1];
    const {
        caption,
        mentions_paragraphs,
        base64_encoded,
        figure_type
    } = figure!;

    const [selectedFigureType, setSelectedFigureType] = useState<string>(figure_type!);

    useEffect(() => {
        setSelectedFigureType(figure_type!);
    }, [figure_type]);

    return (
        <Modal
            opened={opened}
            onClose={close}
            size={"xl"}
            title={"Figures"}
            mih={"80vh"}
        >
            <AsyncDataView
                data={figures}
                messageLoading={"Extracting Figures from Paper"}
                messageError={"Error Extracting Paper Figures"}
                view={(figuresData) => (
                    <Card>
                        <Center>
                            <Pagination
                                value={activePage}
                                onChange={setPage}
                                color={"dark"}
                                total={figuresData.data.length}
                                pb={"xl"}
                            />
                        </Center>
                        <Card.Section>
                            <Title order={4}>{"Figure"}</Title>
                            <Text>
                                {`ID: ${figure.id}`}
                            </Text>
                            <Image
                                src={`data:image/png;base64,${base64_encoded}`}
                                alt={`Figure ${activePage - 1}`}
                                fit={"contain"}
                                height={400} // TODO: Make this dynamic or configurable
                                width={"100%"}
                            />
                        </Card.Section>
                        <Card.Section pt={"md"}>
                            <Center>
                                <Button
                                    size={"xs"}
                                    bg={"yellow"}
                                    onClick={() =>
                                        setSelectedFigure(
                                            { ...figure, figure_type: selectedFigureType }
                                        )
                                    }
                                >
                                    {"Select Figure"}
                                </Button>
                            </Center>
                        </Card.Section>
                        <Card.Section pt={"md"}>
                            <Title order={4}>{"Figure Type"}</Title>
                            <NativeSelect
                                data={FIGURE_TYPES}
                                value={selectedFigureType}
                                onChange={(event) => {
                                    setSelectedFigureType(event.currentTarget.value);
                                }}
                            />
                        </Card.Section>
                        {caption && (
                            <Card.Section pt={"md"}>
                                <Title order={4}>{"Caption"}</Title>
                                <Highlight
                                    size={"sm"}
                                    highlight={captionMatches}
                                    style={{ whiteSpace: "pre-wrap" }}
                                    highlightStyles={() => ({
                                        fontWeight: 700
                                    })}
                                >
                                    {caption}
                                </Highlight>
                            </Card.Section>
                        )}
                        {mentions_paragraphs && (
                            <Card.Section pt={"md"}>
                                <Title order={4}>{"Mentions"}</Title>
                                <Highlight
                                    size={"sm"}
                                    highlight={mentions_paragraphsMatches}
                                    style={{ whiteSpace: "pre-wrap" }}
                                    highlightStyles={() => ({
                                        fontWeight: 700
                                    })}
                                >
                                    {mentions_paragraphs}
                                </Highlight>
                            </Card.Section>
                        )}
                    </Card>
                )}
            />
        </Modal>
    );
};

export default FigureSelector;

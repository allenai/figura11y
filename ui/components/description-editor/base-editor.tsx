import React, { useEffect, useState, useContext } from "react";
import { Container, Text, SimpleGrid, Tooltip, Stack } from "@mantine/core";
import { IconCircleCheckFilled, IconTrashFilled } from "@tabler/icons-react";
import { RichTextEditor } from "@mantine/tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import { Mark } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { SettingsContext } from "@/context/settings-context";
import { Figure, GeneratedDescription } from "@/lib/db-schema";
import { useStore, useUserStore, usePaperStore, useDescriptionStore } from "@/hooks/store";
import { useConditionStore } from "@/hooks/use-condition";
import useEventLogger from "@/hooks/use-event-logger";
import DBClient from "@/lib/db-client";

// Import components this component depends on
import ImageDisplay from "./image-display";
import PromptDataAccordion from "./prompt-data-accordion";
import SummaryModal from "./summary-modal";
import GeneratedOptionsView from "./generated-options-view";
import TextGenerator from "./text-generator";

/**
 * Styling for text within the editor.
 * We use <h6> to mark generated text visually, before suggestions are accepted.
 *
 * @type {string}
 */
const EDITOR_STYLE = `
p {
    display: inline;
    size: 12px;
}

h6:hover {
    cursor: pointer;
    background-color: #e6f7ff;
}

h6 {
    display: inline;
    font-weight: 700;
    background-color: rgba(200, 40, 40, 0.2);
    size: 12px;
}
`;

/**
 * A custom mark for tracking generated text after suggestion incorporation.
 *
 * @type {Mark}
 */
const GeneratedText: Mark = Mark.create({
    name: "generated",
    defaultOptions: {
        HTMLAttributes: {
            "data-generated": "true"
        }
    },
    parseHTML() {
        return [
            {
                tag: "span[data-generated]"
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["span", HTMLAttributes, 0];
    }
});

/**
 * DescriptionEditor props.
 * We just need the figure and contextual information.
 *
 * @interface DescriptionEditorProps
 * @typedef {DescriptionEditorProps}
 * @property {Figure} figure - The figure with info.
 */
interface DescriptionEditorProps {
    // Though we could get this from the store, we pass it in as prop for convenience
    // since it drives the rendering of the component.
    figure: Figure;
    study_session: boolean;
}

/**
 * The DescriptionEditor component. This is the main component for authoring figure descriptions.
 * It contains the image, the prompt data, the editor itself, and the toolbar for suggestion requests.
 *
 * @param {DescriptionEditorProps} props - Props containing figure info.
 */
const BaseEditor: React.FC<DescriptionEditorProps> = ({ figure, study_session = true }) => {
    const user = useUserStore((state) => state.user);

    const descriptionData = useStore(useDescriptionStore, (state) => state.description);
    const initializeDescription = useDescriptionStore((state) => state.initialize);
    const updateDescription = useDescriptionStore((state) => state.updateDescription);

    const paper = usePaperStore((state) => state.paper);

    const condition = useConditionStore((state) => state.condition);

    const [shouldClearDescription, setShouldClearDescription] = useState<boolean>(false);
    const [done, setDone] = useState<boolean>(false);
    const [generatedDescriptions, setGeneratedDescriptions] = useState<GeneratedDescription[]>([]);

    /**
     * We use the settings context to get the current model and custom prompt.
     * We also use it to determine whether to use the figure text, caption, and mentions_paragraphs.
     */
    const [
        {
            model,
            customPrompt
        },
        dispatch
    ] = useContext(SettingsContext);

    /**
     * We use the useEditor hook to get the editor instance with our custom mark as extension.
     */
    const editor = useEditor(
        {
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: "Figure descriptions often begin with a high-level summary. You could begin by writing such a summary."
                }),
                GeneratedText
            ]
        }
    );

    const logger = useEventLogger(editor, condition || "base");

    /**
     * We capture the text in the editor for convenience so that we can use it in the API call and other components.
     */
    const text = editor?.getText() || "";
    const html = editor?.getHTML() || "";

    useEffect(() => {
        if (!user || !figure) {
            return;
        }

        if (!descriptionData || !descriptionData.id) {
            initializeDescription({
                current_string: text,
                current_html: html,
                study_session,
                condition: condition || "base",
                user_id: user.id,
                figure_id: figure.id,
                paper_id: paper?.id || figure.paper_id
            });
        } else {
            updateDescription({
                ...descriptionData,
                current_string: text,
                current_html: html,
                study_session,
                condition: condition || "base"
            });
        }
    }, [text, html, user, figure, paper, study_session, condition]);

    useEffect(() => {
        if (figure.id) {
            DBClient.getGeneratedDescriptionsByFigureId(figure.id).then((descriptions) => {
                setGeneratedDescriptions(descriptions);
            });
        }
    }, [figure.id]);

    useEffect(() => {
        if (descriptionData) {
            if (editor?.isEmpty && !shouldClearDescription) {
                editor?.chain().focus().insertContentAt(0, descriptionData.current_html).run();
            }
        }
    }, [editor]);

    useEffect(() => {
        if (shouldClearDescription) {
            editor?.chain().focus().clearContent().run();
            setShouldClearDescription(false);
        }
    }, [editor, shouldClearDescription]);

    // Focus the editor on component mount.
    useEffect(() => {
        editor?.chain().focus().run();
    }, [editor]);

    return (
        <Container fluid>
            {/* The summary modal is shown when the user clicks on the "Done" button. */}
            <SummaryModal
                text={text}
                figure={figure}
                opened={done}
                onClose={(summarizedDescription) => {
                    setDone(false);
                    if (descriptionData) {
                        if (summarizedDescription) {
                            updateDescription({
                                ...descriptionData,
                                summarized_version: summarizedDescription
                            });
                        }
                    }
                }}
                initialSummarizedDescription={descriptionData?.summarized_version || null}
                model={model}
                customPrompt={customPrompt}
                figureHeight={300}
            />
            {/* The main content of the editor. */}
            <SimpleGrid
                cols={2}
                spacing={"xl"}
                breakpoints={[
                    { minWidth: "64rem", cols: 2 },
                    { maxWidth: "64rem", cols: 1 }
                  ]}
            >
                <Stack>
                    <ImageDisplay
                        imagedata={figure.base64_encoded}
                        altText={text}
                    />
                    <PromptDataAccordion figure={figure}/>
                </Stack>
                <Stack>
                    <RichTextEditor
                        editor={editor}
                        mih={300}
                        bg={"white"}
                        style={{ width: "100%" }}
                    >
                        <style>
                            {EDITOR_STYLE}
                        </style>
                        <RichTextEditor.Toolbar>
                            <RichTextEditor.ControlsGroup ml={"auto"}>
                                <Tooltip label={"Clear Description"}>
                                    <RichTextEditor.Control
                                        onClick={() => setShouldClearDescription(true)}
                                        px={"sm"}
                                        py={"md"}
                                    >
                                            <Text pr={"sm"} size={"sm"}>
                                                {"Clear "}
                                            </Text>
                                            <IconTrashFilled size={20}/>
                                    </RichTextEditor.Control>
                                </Tooltip>
                                <Tooltip label={"Click to Complete Description"}>
                                    <RichTextEditor.Control
                                        onClick={() => setDone(true)}
                                        px={"sm"}
                                        py={"md"}
                                    >
                                            <Text pr={"sm"} size={"sm"}>
                                                {"Submit "}
                                            </Text>
                                            <IconCircleCheckFilled size={20}/>
                                    </RichTextEditor.Control>
                                </Tooltip>
                            </RichTextEditor.ControlsGroup>
                        </RichTextEditor.Toolbar>
                        <RichTextEditor.Toolbar/>
                        <RichTextEditor.Content/>
                    </RichTextEditor>
                    <GeneratedOptionsView
                        options={generatedDescriptions.map((description) => ({
                            model: description.model,
                            text: description.description
                        }))}
                    />
                    <TextGenerator model={model}/>
                </Stack>
            </SimpleGrid>
        </Container>
    );
};

export default BaseEditor;

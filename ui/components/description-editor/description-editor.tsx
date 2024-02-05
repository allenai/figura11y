import React, { useEffect, useLayoutEffect, useState, useContext } from "react";
import { Container, SimpleGrid, Stack, Text, Kbd } from "@mantine/core";
import { RichTextEditor } from "@mantine/tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import { Mark } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import { Slice, Fragment } from "@tiptap/pm/model";
import { StarterKit } from "@tiptap/starter-kit";
import { useAsyncRequest } from "@/lib/requests";
import { useIdle } from "@mantine/hooks";
import { useMetaKeySymbol } from "@/hooks";
import { SettingsContext } from "@/context/settings-context";
import { Figure, GeneratedDescription } from "@/lib/db-schema";
import { useStore, useUserStore, usePaperStore, useDescriptionStore, useSuggestionsStore } from "@/hooks/store";
import { QAPair } from "@/lib/types";
import { useConditionStore } from "@/hooks/use-condition";
import useEventLogger from "@/hooks/use-event-logger";
import DBClient from "@/lib/db-client";

// Import components this component depends on
import ImageDisplay from "./image-display";
import PromptDataAccordion from "./prompt-data-accordion";
import SummaryModal from "./summary-modal";
import SuggestionPopover from "./suggestion-popover";
import DescriptionEditorToolbar from "./description-editor-toolbar";
// import QASuggestionsView from "./QASuggestionsView";
import QASuggestionsChat from "./qa-suggestions-chat";
import GeneratedOptionsView from "./generated-options-view";

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
            "class": "generated-text"
        }
    },
    parseHTML() {
        return [
            {
                tag: "p.generated-text"
            }
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["p", HTMLAttributes, 0];
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
const DescriptionEditor: React.FC<DescriptionEditorProps> = ({ figure, study_session }) => {
    const user = useUserStore((state) => state.user);

    const descriptionData = useStore(useDescriptionStore, (state) => state.description);
    const initializeDescription = useDescriptionStore((state) => state.initialize);
    const updateDescription = useDescriptionStore((state) => state.updateDescription);

    const suggestionsData = useStore(useSuggestionsStore, (state) => state.suggestions);
    const initializeSuggestions = useSuggestionsStore((state) => state.initialize);
    const addSuggestion = useSuggestionsStore((state) => state.addSuggestion);

    const paper = usePaperStore((state) => state.paper);

    const condition = useConditionStore((state) => state.condition);

    const [allQuestions, setAllQuestions] = useState<QAPair[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const [completionMessages, setCompletionMessages] = useState<string[]>([]);
    const [popoverTarget, setPopoverTarget] = useState<HTMLElement | null>(null);
    const [popoverShown, setPopoverShown] = useState<boolean>(false);
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const [shouldClearDescription, setShouldClearDescription] = useState<boolean>(false);
    const [shouldGenerateDraft, setShouldGenerateDraft] = useState<boolean>(false);
    const [generatedDescriptions, setGeneratedDescriptions] = useState<GeneratedDescription[]>([]);
    const [done, setDone] = useState<boolean>(false);

    /**
     * We use the settings context to get the current model and custom prompt.
     * We also use it to determine whether to use the figure text, caption, and mentions_paragraphs.
     */
    const [
        {
            model,
            customPrompt,
            shouldUseFigureText,
            shouldUseFigureCaption,
            shouldUseFigureMentions,
            shouldUseDataTable
        },
        dispatch
    ] = useContext(SettingsContext);

    // We use the meta key symbol to display the key command for requesting a new question.
    const metaKeySymbol = useMetaKeySymbol();

    // If the user is idle for 10 seconds, we remind them that they can generate suggestions.
    const idle = useIdle(1000 * 10);

    /**
     * We use the useEditor hook to get the editor instance with our custom mark as extension.
     */
    const editor = useEditor(
        {
            extensions: [
                StarterKit,
                Placeholder.configure({
                    placeholder: "Figure descriptions often begin with a high-level summary. You could begin by writing such a summary, or pressing TAB to generate one."
                }),
                GeneratedText
            ]
        }
    );

    const logger = useEventLogger(editor, condition || "full");

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
                condition: condition || "full",
                user_id: user.id,
                figure_id: figure.id,
                paper_id: paper?.id || figure.paper_id
            });
        } else {
            updateDescription({
                ...descriptionData,
                study_session,
                condition: condition || "full",
                current_string: text,
                current_html: html
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
    }, [descriptionData, descriptionData?.current_html, editor]);

    useEffect(() => {
        if (shouldClearDescription) {
            editor?.chain().focus().clearContent().run();
            setShouldClearDescription(false);
        }
    }, [editor, shouldClearDescription]);

    /**
     * Wrapper for Q&A type suggestion data.
     */
    const questions = useAsyncRequest<QAPair[]>({
        defaultValue: [],
        apiCall: async () => {
            const {
                caption,
                mentions_paragraphs,
                figure_type,
                ocr_text,
                data_table
            } = figure;

            const response = await fetch("/api/feedback", {
                method: "POST",
                body: JSON.stringify({
                    description: text,
                    messages,
                    model,
                    customPrompt,
                    figure_type,
                    ocr_text: shouldUseFigureText ? ocr_text : undefined,
                    caption: shouldUseFigureCaption ? caption : undefined,
                    mentions_paragraphs: shouldUseFigureMentions ? mentions_paragraphs : undefined,
                    data_table: shouldUseDataTable ? data_table : undefined
                })
            });
            const feedback = await response.json();

            setMessages(feedback.messages);
            return feedback.result;
        },
        dependencies: [
            editor,
            messages,
            figure,
            model,
            customPrompt,
            shouldUseFigureText,
            shouldUseFigureCaption,
            shouldUseFigureMentions,
            shouldUseDataTable
        ],
        autoFetch: false
    });

    // Append new suggestions to the list of all generated Q&A type suggestions so far.
    useEffect(() => {
        if (!user || !descriptionData) {
            return;
        }

        if (questions.data) {
            questions.data.forEach((qa) => {
                addSuggestion(
                    {
                        content: qa,
                        suggestion_type: "qa",
                        model,
                        text_context: text,
                        description_id: descriptionData.id,
                        user_id: user.id
                    }
                );
            });
        }
    }, [questions.data]);

    useEffect(() => {
        if (suggestionsData && suggestionsData.length) {
            setAllQuestions(
                suggestionsData
                    .sort((a, b) => (
                            new Date(a.date_suggested)
                        ) > (
                            new Date(b.date_suggested)
                        ) ? -1 : 1)
                    .filter((suggestion) => suggestion.suggestion_type === "qa")
                    .map((suggestion) => JSON.parse(suggestion.content as string) as QAPair)
            );
        }
    }, [suggestionsData]);

    useEffect(() => {
        if (!user) {
            return;
        }
        if (descriptionData && descriptionData.id) {
            initializeSuggestions(descriptionData.id);
        }
    }, [user, descriptionData]);

    /**
     * Wrapper for continuation or completion type suggestion data.
     * We use the text before the cursor as the description.
     */
    const completion = useAsyncRequest<string | null>({
        defaultValue: null,
        apiCall: async () => {
            const {
                caption,
                mentions_paragraphs,
                figure_type,
                ocr_text,
                data_table
            } = figure;

            // Get the text before the cursor.
            const cursorPosition = editor?.state.selection.$head.pos;
            const textBeforeCursor = cursorPosition ?
                editor?.state.doc.textBetween(0, cursorPosition, "\n\n") :
                "";
            const textAfterCursor = cursorPosition ?
                editor?.state.doc.textBetween(cursorPosition, editor.state.doc.nodeSize - 2, "\n\n") :
                "";
            const description = textBeforeCursor + textAfterCursor;
            const response = await fetch(description.length ? "/api/completion" : "/api/summary", {
                method: "POST",
                body: JSON.stringify({
                    description: textBeforeCursor,
                    descriptionContext: textAfterCursor,
                    messages: completionMessages,
                    model,
                    customPrompt,
                    figure_type,
                    ocr_text: shouldUseFigureText ? ocr_text : undefined,
                    caption: shouldUseFigureCaption ? caption : undefined,
                    mentions_paragraphs: shouldUseFigureMentions ? mentions_paragraphs : undefined,
                    data_table: shouldUseDataTable ? data_table : undefined
                })
            });
            const data = await response.json();

            setCompletionMessages(data.messages);
            return data.result;
        },
        dependencies: [
            editor,
            completionMessages,
            figure,
            model,
            customPrompt,
            shouldUseFigureText,
            shouldUseFigureCaption,
            shouldUseFigureMentions,
            shouldUseDataTable
        ],
        autoFetch: false
    });

    useEffect(() => {
        if (!user?.id || !descriptionData?.id) {
            return;
        }

        if (questions.data && questions.data.length) {
            addSuggestion(
                {
                    content: questions.data[0],
                    suggestion_type: "qa",
                    model,
                    study_session,
                    text_context: text,
                    description_id: descriptionData.id,
                    user_id: user.id
                }
            );
        }
    }, [
        questions.data,
        questions.data?.length,
        text,
        model,
        descriptionData,
        descriptionData?.id,
        user,
        user?.id
    ]);

    /**
     * Function for draft generation.
     */
    const generateDraft = async () => {
        if (!user || !figure) {
            return;
        }

        const {
            caption,
            mentions_paragraphs,
            figure_type,
            ocr_text,
            data_table
        } = figure;

        // Get the text before the cursor.
        const cursorPosition = editor?.state.selection.$head.pos;
        const textBeforeCursor = cursorPosition ?
            editor?.state.doc.textBetween(0, cursorPosition, "\n\n") :
            "";
        const textAfterCursor = cursorPosition ?
            editor?.state.doc.textBetween(cursorPosition, editor.state.doc.nodeSize - 2, "\n\n") :
            "";
        const response = await fetch("/api/draft", {
            method: "POST",
            body: JSON.stringify({
                description: textBeforeCursor,
                descriptionContext: textAfterCursor,
                messages: completionMessages,
                model,
                customPrompt,
                figure_type,
                ocr_text: shouldUseFigureText ? ocr_text : undefined,
                caption: shouldUseFigureCaption ? caption : undefined,
                mentions_paragraphs: shouldUseFigureMentions ? mentions_paragraphs : undefined,
                data_table: shouldUseDataTable ? data_table : undefined
            })
        });
        const data = await response.json();

        await DBClient.addOrUpdateGeneratedDescription({
            figure_id: figure.id,
            model,
            description: data.result
        });
    };

    // Change the cursor depending on the loading state of the completion request.
    // We prefer this to a loading spinner, since the user can still type while they wait.
    // Additionally, this positions the loading cursor at the request point (in principle).
    useEffect(() => {
        if (completion.loading || questions.loading) {
            document.body.style.cursor = "wait";
        } else {
            document.body.style.cursor = "default";
        }
    }, [completion.loading, questions.loading]);

    useEffect(() => {
        if (shouldGenerateDraft) {
            // Change cursor directly here; independent workflow for drafts
            document.body.style.cursor = "wait";
            generateDraft().then(() => {
                setShouldGenerateDraft(false);
                document.body.style.cursor = "default";
                window.location.reload();
            });
        }
    }, [shouldGenerateDraft]);

    // Insert the completion text at the cursor position as <h6> to visually differentiate it.
    useEffect(() => {
        if (completion.data && completion.data.length) {
            const cursorPosition = editor?.state.selection.$head.pos;
            editor?.chain().focus().insertContentAt(
                cursorPosition || 0,
                `<h6>${completion.data}</h6>`
            ).run();
        }
    }, [completion.data]);

    // Update the popover position when the user clicks on a generated suggestion.
    useLayoutEffect(() => {
        if (popoverTarget) {
            const rect = popoverTarget.getBoundingClientRect();
            setPopoverPosition({ top: rect.top, left: rect.left });
        }
    }, [popoverTarget]);

    /**
     * Present a popover asking the user to accept or decline the suggestion.
     *
     * @param {HTMLElement} target - The target element that was clicked.
     * @returns {void}
     */
    const acceptSuggestion = (target: HTMLElement) => {
        if (target.tagName !== "H6") return;
        setPopoverTarget(target);
        setPopoverShown(true);
    };

    /**
     * Handle the user's action on the popover (either accept or deleting the suggestion, reprocessing the text).
     * If confirmed, we visually integrate the text as a <p> element (but identify it with our custom mark).
     * If deleted, we remove the text from the editor entirely.
     *
     * @param {("confirm" | "delete")} action - The action to take.
     * @returns {void}
     */
    const handleEditorAction = (action: "confirm" | "delete") => {
        const target = popoverTarget;
        if (!target) return;
        const localText = target.innerText;

        if (!editor) return;
        const { state } = editor;

        if (state) {
            const { doc } = state;
            let from = 0;
            let to = 0;

            doc.descendants((node, pos) => {
                if (node.type.name === "heading" && node.attrs.level === 6 && node.content.firstChild?.text === localText) {
                    from = pos;
                    to = pos + node.nodeSize;
                    return false;
                }
                return true;
            });

            if (from !== to) {
                const { tr } = state;
                if (action === "confirm") {
                    const p = state.schema.nodes.paragraph.create(
                        {
                            class: "generated"
                        },
                        state.schema.text(localText),
                        [state.schema.marks.generated.create()]
                    );
                    const slice = new Slice(Fragment.from(p), 0, 0);
                    tr.replaceRange(from, to, slice);
                } else if (action === "delete") {
                    tr.delete(from, to);
                }
                editor.view.dispatch(tr);
            }
        }

        completion.setData(null); // Clear the completion data.
        setPopoverTarget(null);
        setPopoverShown(false);
    };

    // Convenience functions for handling popover actions.
    const handleConfirm = () => handleEditorAction("confirm");
    const handleX = () => handleEditorAction("delete");

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
            {/* The suggestion popover is shown when the user clicks on a generated suggestion. */}
            <SuggestionPopover
                opened={popoverShown}
                onClose={() => setPopoverShown(false)}
                position={popoverPosition}
                handleConfirm={handleConfirm}
                handleX={handleX}
                transitionDuration={300}
                bgColor={"#1B4596"}
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
                        onKeyDown={(event) => {
                            if (event.key === "Tab") {
                                event.preventDefault();
                                completion.fetchData();
                            }
                            if (event.metaKey && event.key === "/") {
                                event.preventDefault();
                                questions.fetchData();
                            }
                        }}
                        mih={240}
                        bg={"white"}
                        onClick={(event) => acceptSuggestion(event.target as HTMLElement)}
                        style={{ width: "100%" }}
                    >
                        <style>
                            {EDITOR_STYLE}
                        </style>
                        <DescriptionEditorToolbar
                            completion={completion}
                            questions={questions}
                            editor={editor}
                            onClearDescription={() => {
                                setShouldClearDescription(true);
                            }}
                            onSetDone={setDone}
                        />
                        <RichTextEditor.Content/>
                    </RichTextEditor>
                    <Stack>
                        {idle ? (
                            <Text size={"xs"} c={"gray"}>
                                <Kbd size={"sm"}>{"TAB"}</Kbd>{" to generate a continuation from current position."}
                                {" OR "}<Kbd size={"sm"}>{`${metaKeySymbol}+/`}</Kbd>{" to get a guiding question."}
                            </Text>
                        ) : null}
                        <GeneratedOptionsView
                            options={generatedDescriptions.map((description) => ({
                                model: description.model,
                                text: description.description
                            }))}
                            generate={() => setShouldGenerateDraft(true)}
                        />
                        <QASuggestionsChat
                            questions={questions}
                            allQuestions={allQuestions}
                        />
                    </Stack>
                </Stack>
            </SimpleGrid>
        </Container>
    );
};

export default DescriptionEditor;

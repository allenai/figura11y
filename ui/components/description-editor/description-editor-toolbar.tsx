import React from "react";
import { Editor } from "@tiptap/react";
import { Tooltip, Text, Kbd } from "@mantine/core";
import { UseAsyncRequestResult } from "@/lib/requests";
import { useMetaKeySymbol } from "@/hooks";
import { IconCircleCheckFilled, IconPencilPlus, IconTrashFilled, IconMessageQuestion } from "@tabler/icons-react";
import { RichTextEditor } from "@mantine/tiptap";
import { QAPair } from "@/lib/types";

/**
 * DescriptionEditorToolbar props.
 *
 * @interface DescriptionEditorToolbarProps
 * @typedef {DescriptionEditorToolbarProps}
 *
 * @property {UseAsyncRequestResult<string | null>} completion - The completion data wrapper.
 * @property {UseAsyncRequestResult<QAPair[]>} questions - The Q&A data wrapper.
 * @property {Editor | null} editor - The TipTap editor instance.
 * @property {(done: boolean) => void} onSetDone - What to do when the user clicks the done button.
 */
interface DescriptionEditorToolbarProps {
    completion: UseAsyncRequestResult<string | null>;
    questions: UseAsyncRequestResult<QAPair[]>;
    editor: Editor | null;
    onClearDescription: () => void;
    onSetDone: (done: boolean) => void;
}

/**
 * A toolbar for the description editor, containing buttons to support user actions.
 * It contains the buttons to request continuation and questions.
 * It also contains the done button, to mark a written description as completed.
 *
 * @param {DescriptionEditorToolbarProps} props - Props containing suggestion data wrappers, the editor instance, and the done callback.
 */
const DescriptionEditorToolbar: React.FC<DescriptionEditorToolbarProps> = ({
    completion,
    questions,
    editor,
    onClearDescription,
    onSetDone
}) => {
    const metaKeySymbol = useMetaKeySymbol();
    return (
        <RichTextEditor.Toolbar>
            <RichTextEditor.ControlsGroup>
                <Tooltip label={"Request Suggested Text (or TAB)"}>
                    <RichTextEditor.Control
                        onClick={() => completion.fetchData()}
                        aria-label={"Request Suggested Text (or TAB)"}
                        title={"Request Suggested Text (or TAB)"}
                        px={"sm"}
                        py={"md"}
                    >
                            <IconPencilPlus size={20} style={{ marginRight: 4 }}/>
                            <Text size={"sm"}>
                                {"Generate at Cursor "}
                                {"("}<Kbd p={0} m={0} pt={4} size={"sm"}>{"TAB"}</Kbd>{")"}
                            </Text>
                    </RichTextEditor.Control>
                </Tooltip>
                <Tooltip label={"Request Question"}>
                    <RichTextEditor.Control
                        onClick={() => questions.fetchData()}
                        aria-label={"Request Potential User Question"}
                        title={"Request Potential User Question"}
                        px={"sm"}
                        py={"md"}
                    >
                        <IconMessageQuestion size={20} style={{ marginRight: 4 }}/>
                        <Text size={"sm"}>
                            {"Potential User Question "}
                            {"("}<Kbd p={0} m={0} pt={4} size={"sm"}>{`${metaKeySymbol}+/`}</Kbd>{")"}
                        </Text>
                    </RichTextEditor.Control>
                </Tooltip>
            </RichTextEditor.ControlsGroup>
            <RichTextEditor.ControlsGroup ml={"auto"}>
                <Tooltip label={"Clear Description"}>
                    <RichTextEditor.Control
                        onClick={onClearDescription}
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
                        onClick={() => onSetDone(true)}
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
    );
};

export default DescriptionEditorToolbar;

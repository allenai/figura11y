import { useState } from "react";
import { FileWithPath } from "@mantine/dropzone";

/**
 * Document state.
 *
 * @interface DocumentState
 * @typedef {DocumentState}
 *
 * @property {FileWithPath | null} document - PDF file representing document.
 * @property {(document: FileWithPath | null) => void} setDocument - Function to set document.
 */
interface DocumentState {
    document: FileWithPath | null;
    setDocument: (document: FileWithPath | null) => void;
}

/**
 * A hook to manage document state (of the uploaded PDF).
 *
 * @returns {DocumentState} - Document state and setter.
 */
export const useDocument = (): DocumentState => {
    const [document, setDocument] = useState<FileWithPath | null>(null);
    return { document, setDocument };
};

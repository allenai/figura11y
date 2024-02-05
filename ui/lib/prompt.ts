/**
 * Prompt result, containing the system prompt, the user prompt, and the prompt spec (i.e. the user prompt components).
 *
 * @typedef {PromptResult}
 */
type PromptResult = [string, string, string[]];

/**
 * Convenience function to create a prompt based on figure metadata.
 * Will only use a given metadata field if it is not null or empty.
 *
 * @param {string} systemPrompt - The system prompt.
 * @param {string} figuretypeDocFigure - The figure type.
 * @param {?string} [caption] - The figure caption.
 * @param {?string} [paragraph] - The figure mentions as one long string.
 * @param {?string} [ocr] - The OCR text.
 * @param {?string} [datatable] - The data table.
 * @param {?string} [guidelines] - The guidelines.
 * @returns {PromptResult} - The prompt result (system prompt, user prompt, prompt spec; see {@link PromptResult}}).
 */
export const makePrompt = (
    systemPrompt: string,
    figuretypeDocFigure: string,
    caption?: string,
    paragraph?: string,
    ocr?: string,
    datatable?: string,
    guidelines?: string
): PromptResult => {
    let prompt = `FIGURE TYPE\n${figuretypeDocFigure}\n`;
    const promptSpec: string[] = ["figuretype"];

    const fullSystemPrompt = systemPrompt;
    prompt += systemPrompt;

    // Add caption
    if (caption && caption.length) {
        prompt += `\n---\nCAPTION\n${caption}\n`;
        promptSpec.push("caption");
    }

    // Add mentions
    if (paragraph && paragraph.length) {
        prompt += `\n---\nFIGURE MENTIONS FROM PAPER\n${paragraph}\n`;
        promptSpec.push("mentions");
    }

    // Add OCR
    if (ocr && ocr.length) {
        prompt += `\n---\nOCR TEXT RECOGNIZED FROM FIGURE (MAY CONTAIN ERRORS)\n${ocr}\n`;
        promptSpec.push("ocr");
    }

    // Add datatable
    if (datatable && datatable.length) {
        prompt += `\n---\nDATA TABLE EXTRACTED FROM FIGURE (MAY CONTAIN ERRORS)\n${datatable}\n`;
        promptSpec.push("datatable");
    }

    // Add guidelines
    if (guidelines && guidelines.length) {
        prompt += `\n---Please refer to the following guidelines when writing your description:\n${guidelines}\n---`;
        promptSpec.push("guidelines");
    }

    return [fullSystemPrompt, prompt, promptSpec];
};

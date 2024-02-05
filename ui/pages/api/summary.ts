import type { NextApiRequest, NextApiResponse } from "next";
import { GuidelineService, GUIDELINES } from "@/lib/guidelines";
import { makePrompt } from "@/lib/prompt";
import { SuggestionRequest } from "@/lib/types";
import OpenAIClient, { Message } from "@/lib/openai-client";

/**
 * Prompt for the initial high-level summary generation task.
 *
 * @returns {string}
 */
const summaryPrompt = (): string => `Your goal is to assist in writing an alt text description of a figure that is as informative and accessible as possible, based on metadata provided to you.
Some of this data is automatically extracted from the figure, and may contain errors. Infer as much detail as possible from the information given.
Respond with only a brief and high-level overview (1-2 sentences), with no additional content. In your response, do not explicitly refer to the metadata (such as "caption" or "OCR text"). These are provided to help you write descriptive responses only.`;

/**
 * API route handler for the initial high-level summary generation task.
 *
 * @export
 * @async
 * @param {NextApiRequest} req - The request object, assumed to contain the {@link SuggestionRequest} parameters in the body.
 * @param {NextApiResponse<{ result: string, messages?: Message[] }>} res - The response object, with the result and messages (if any).
 * @returns {*}
 */
export default async (
    req: NextApiRequest,
    res: NextApiResponse<{ result: string, messages?: Message[] }>
) => {
    const requestInfo = JSON.parse(req.body) as SuggestionRequest;
    const guidelines = (new GuidelineService(GUIDELINES)).getGuidelines(requestInfo.figure_type);
    const [systemPrompt, prompt, _] = makePrompt(
        summaryPrompt(),
        requestInfo.figure_type,
        requestInfo.caption,
        requestInfo.mentions_paragraphs,
        requestInfo.ocr_text,
        requestInfo.data_table,
        guidelines
    );

    const promptDescription = `${prompt}\n\n---\nDESCRIPTION\n${requestInfo.description}`;

    const { completion, messages } = await OpenAIClient.requestCompletion(
        systemPrompt,
        promptDescription,
        requestInfo.messages,
        requestInfo.model
    );
    const result = completion.choices[0].message?.content;

    res.status(200).json({ result: result || "", messages });
};

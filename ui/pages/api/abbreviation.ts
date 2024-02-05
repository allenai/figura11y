import type { NextApiRequest, NextApiResponse } from "next";
import { SuggestionRequest } from "@/lib/types";
import OpenAIClient, { Message } from "@/lib/openai-client";

/**
 * Prompt for the description abbreviation task.
 *
 * @returns {string}
 */
const abreviationPrompt = (): string => `Your goal is to provide a brief summary of the given description of a figure.
Respond with only a one-paragrph and accurate summary, prioritizing the most important information for understanding the figure without seeing it. In your response, do not explicitly refer to the metadata (such as "caption" or "OCR text"). These are provided to help you write descriptive responses only.`;

/**
 * API route handler for the description abbreviation task.
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
    const systemPrompt = abreviationPrompt();

    const { completion, messages } = await OpenAIClient.requestCompletion(
        systemPrompt,
        `Description:\n${requestInfo.description}`,
        requestInfo.messages,
        requestInfo.model
    );
    const result = completion.choices[0].message?.content;

    res.status(200).json({ result: result || "", messages });
};

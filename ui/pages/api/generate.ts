import type { NextApiRequest, NextApiResponse } from "next";
import OpenAIClient, { Message } from "@/lib/openai-client";

/**
 * The request body for the text generation task.
 *
 * @interface TextGenerationRequest
 * @property {string} prompt - The prompt to use for the text generation.
 * @property {string} model - The model to use for the text generation.
 */
interface TextGenerationRequest {
    prompt: string;
    model: string;
}

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
    const requestInfo = JSON.parse(req.body) as TextGenerationRequest;

    const { completion, messages } = await OpenAIClient.requestCompletion(
        "",
        requestInfo.prompt,
        [],
        requestInfo.model
    );
    const result = completion.choices[0].message?.content;

    res.status(200).json({ result: result || "", messages });
};

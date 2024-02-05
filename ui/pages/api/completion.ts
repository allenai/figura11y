import type { NextApiRequest, NextApiResponse } from "next";
import { GuidelineService, GUIDELINES } from "@/lib/guidelines";
import { makePrompt } from "@/lib/prompt";
import { SuggestionRequest } from "@/lib/types";
import OpenAIClient, { Message } from "@/lib/openai-client";

/**
 * Prompt for the completion type suggestion generation task.
 *
 * @returns {string}
 */
const completionPrompt = (): string => `Your goal is to assist in writing an alt text description of a figure that is as informative and accessible as possible, based on metadata provided to you.
Some of this data is automatically extracted from the figure, and may contain errors. Infer as much detail as possible from the information given. Only include clear and helpful statements for understanding the figure. Do not make explicit reference to the metadata (such as "caption" or "OCR text"). These are provided to help you write descriptive responses only.
Respond with only a continuation of the given description itself (1-4 sentences), with no additional content. Add as much detail as possible. You may also be given a DESCRIPTION CONTEXT, which contains text after your response. In this case, provide text that bridges the gap between the description, and additional text the user has already written.
In your response, do not explicitly refer to the metadata (such as "caption" or "OCR text"). These are provided to help you write descriptive responses only.`;

/**
 * API route handler for the completion type suggestion generation task.
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
    const shouldAddContext = (!requestInfo.messages?.length);
    const [systemPrompt, prompt, _] = makePrompt(
        shouldAddContext ? completionPrompt() : "",
        shouldAddContext ? requestInfo.figure_type : "",
        shouldAddContext ? requestInfo.caption : "",
        shouldAddContext ? requestInfo.mentions_paragraphs : "",
        shouldAddContext ? requestInfo.ocr_text : "",
        shouldAddContext ? requestInfo.data_table : "",
        shouldAddContext ? guidelines : ""
    );

    const descriptionContext = (
        requestInfo.descriptionContext &&
        requestInfo.descriptionContext.length
    ) ?
        `$[YOUR RESPONSE WILL BE ADDED HERE]${requestInfo.descriptionContext}` :
        "";

    const promptDescription = `${prompt}\n\n---\nDESCRIPTION SNIPPET\n${requestInfo.description}${descriptionContext}\n---\n`;

    const { completion, messages } = await OpenAIClient.requestCompletion(
        systemPrompt,
        promptDescription,
        requestInfo.messages,
        requestInfo.model
    );
    const result = completion.choices[0].message?.content;

    res.status(200).json({ result: result || "", messages });
};

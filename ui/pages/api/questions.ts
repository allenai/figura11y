import type { NextApiRequest, NextApiResponse } from "next";
import { GuidelineService, GUIDELINES } from "@/lib/guidelines";
import { makePrompt } from "@/lib/prompt";
import { SuggestionRequest, QAPair } from "@/lib/types";
import OpenAIClient, { Message, Function, FunctionCall } from "@/lib/openai-client";

/**
 * Prompt for the QA type suggestion generation task.
 *
 * @returns {string}
 */
const questionPrompt = (): string => `Your goal is to assist in writing an alt text description of a figure that is as informative and accessible as possible. Infer as much detail as possible from the information given.
What visual aspects of the figure are unclear from the given alt text description? Ask a series of questions to elicit all the necessary information about the figure to describe these elements. Based on the type of figure, focus on essential visual aspects that someone who cannot see the figure would need to know. Based on the guidelines and metadata you have access to, suggest an answer for each question. In your response, do not explicitly refer to the metadata (such as "caption" or "OCR text"). These are provided to help you write descriptive responses only. Do not repeat any existing questions.`;

/**
 * API route handler for the QA type suggestion generation task.
 *
 * @export
 * @async
 * @param {NextApiRequest} req - The request object, assumed to contain the {@link SuggestionRequest} parameters in the body.
 * @param {NextApiResponse<{ result: QAPair[], messages?: Message[] }>} res - The response object, with the result and messages (if any).
 * @returns {*}
 */
export default async (
    req: NextApiRequest,
    res: NextApiResponse<{ result: QAPair[], messages?: Message[] }>
) => {
    const requestInfo = JSON.parse(req.body) as SuggestionRequest;
    const guidelines = (new GuidelineService(GUIDELINES)).getGuidelines(requestInfo.figure_type);
    const shouldAddContext = (!requestInfo.messages?.length);
    const [systemPrompt, prompt, _] = makePrompt(
        shouldAddContext ? questionPrompt() : "",
        shouldAddContext ? requestInfo.figure_type : "",
        shouldAddContext ? requestInfo.caption : "",
        shouldAddContext ? requestInfo.mentions_paragraphs : "",
        shouldAddContext ? requestInfo.ocr_text : "",
        shouldAddContext ? requestInfo.data_table : "",
        shouldAddContext ? guidelines : ""
    );

    const functions: Function[] = [
        {
            name: "add_question",
            description: "Ask a question to the user.",
            parameters: {
                type: "object",
                properties: {
                    question: {
                        type: "string",
                        description: "The question about the chart to automatically answer."
                    },
                    suggested_answer: {
                        type: "string",
                        description: "Your suggested answer to the question based on information available."
                    }
                },
                required: ["question", "suggested_answer"]
            }
        }
    ];
    const functionCall: FunctionCall = { name: "add_question" };

    const promptDescription = `${prompt}\n\n---\nDESCRIPTION\n${requestInfo.description}`;

    const { responses, messages } = await OpenAIClient.getQA(
        systemPrompt,
        promptDescription,
        requestInfo.messages,
        functions,
        functionCall,
        4,
        requestInfo.model
    );

    res.status(200).json({ result: responses, messages });
};

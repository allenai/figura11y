import OpenAI from "openai";
import { QAPair } from "@/lib/types";

/**
 * Convenience type for OpenAI.Chat.CreateChatCompletionRequestMessage.
 *
 * @export
 * @typedef {Message}
 */
export type Message = OpenAI.Chat.CreateChatCompletionRequestMessage;

/**
 * Convenience type for OpenAI.Chat.CompletionCreateParams.Function.
 *
 * @export
 * @typedef {Function}
 */
export type Function = OpenAI.Chat.CompletionCreateParams.Function;

/**
 * Convenience type for OpenAI.Chat.CompletionCreateParams.FunctionCallOption.
 *
 * @export
 * @typedef {FunctionCall}
 */
export type FunctionCall = OpenAI.Chat.CompletionCreateParams.FunctionCallOption;

/**
 * A singleton class to manage OpenAI API calls.
 *
 * @class OpenAIClient
 * @typedef {OpenAIClient}
 */
class OpenAIClient {
    private static instance: OpenAIClient;
    private openai: OpenAI;

    private constructor() {
        this.openai = new OpenAI({
           apiKey: process.env.OPENAI_API_KEY,
           organization: process.env.OPENAI_API_ORG
       });
    }

    /**
     * Get the instance of the OpenAIClient.
     *
     * @public
     * @static
     * @returns {OpenAIClient}
     */
    public static getInstance(): OpenAIClient {
        if (!OpenAIClient.instance) {
            OpenAIClient.instance = new OpenAIClient();
        }
        return OpenAIClient.instance;
    }

    /**
     * Request a completion suggestion.
     * @date 8/29/2023 - 2:18:32 PM
     *
     * @public
     * @async
     * @param {string} systemPrompt - The system prompt.
     * @param {string} prompt - The user prompt.
     * @param {?Message[]} [messageHistory] - The message history.
     * @param {string} [model="gpt-4-0613"] - The OpenAI model to use.
     * @param {number} [n=1] - The number of completions to generate.
     * @param {number} [temperature=0.2] - The temperature to use.
     * @param {{ [key: number]: number }} [logitBias={
                94595: -100, // "OCR"
                24232: -1, // "caption"
                18103: -1 // "metadata"
            }] - The logit bias to use (by default, bias away from mentioning metadata).
     * @returns {Promise<{ completion: OpenAI.Chat.ChatCompletion, messages: Message[] }>} - The completion and new message history.
     */
    public async requestCompletion(
        systemPrompt: string,
        prompt: string,
        messageHistory?: Message[],
        model: string = "gpt-4-0613",
        n: number = 1,
        temperature: number = 0.2,
        logitBias: { [key: number]: number } = {
            94595: -100, // "OCR"
            24232: -1, // "caption"
            18103: -1 // "metadata"
        }
    ): Promise<{ completion: OpenAI.Chat.ChatCompletion, messages: Message[] }> {
        const messageList: Message[] = messageHistory ? messageHistory.map((message) => {
            if (message.role === "system") {
                return Object.assign(message, { content: systemPrompt });
            }
            return message;
        }).concat([{
            role: "user",
            content: prompt
        }]) : [
            {
                "role": "system",
                "content": systemPrompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ];

        const request: OpenAI.Chat.CompletionCreateParamsNonStreaming = {
            model,
            messages: messageList,
            n,
            temperature,
            logit_bias: logitBias
        };

        const completion = await this.openai.chat.completions.create(request);
        return {
            completion,
            messages: messageList
        };
    }

    /**
     * Request a set of Q&A-type suggestions.
     *
     * @public
     * @async
     * @param {string} systemPrompt - The system prompt.
     * @param {string} prompt - The user prompt.
     * @param {?Message[]} [messageHistory] - The message history.
     * @param {?Function[]} [functions] - The functions to use.
     * @param {?FunctionCall} [functionCall] - The function call to use.
     * @param {number} [n_qa=4] - The number of Q&A pairs to generate.
     * @param {string} [model="gpt-4-0613"] - The OpenAI model to use.
     * @returns {Promise<{ responses: QAPair[], messages: Message[] }>} - The responses and new message history.
     */
    public async getQA(
        systemPrompt: string,
        prompt: string,
        messageHistory?: Message[],
        functions?: Function[],
        functionCall?: FunctionCall,
        n_qa: number = 4,
        model: string = "gpt-4-0613"
    ): Promise<{ responses: QAPair[], messages: Message[] }> {
        const messageList: Message[] = messageHistory ? messageHistory.map((message) => {
            if (message.role === "system") {
                return Object.assign(message, { content: systemPrompt });
            }
            return message;
        }).concat([{
            role: "user",
            content: prompt
        }]) : [
            {
                "role": "system",
                "content": systemPrompt
            },
            {
                "role": "user",
                "content": prompt
            }
        ];

        const request: OpenAI.Chat.CompletionCreateParamsNonStreaming = {
            model,
            messages: messageList,
            function_call: functionCall,
            functions,
            n: 1
        };

        // We need to iteratively request Q&A pairs.
        // We'll do this by requesting a single Q&A pair at a time, and then using the response to generate the next request.
        // The goal of this is to avoid Q&A pairs that are too similar to each other, which can happen if we request them all in parallel.
        const responses: QAPair[] = [];
        while (true && responses.length < n_qa) {
            // eslint-disable-next-line no-await-in-loop
            const response = await this.openai.chat.completions.create(Object.assign(
                request,
                {
                    messages: messageList
                }
            ));
            const { message } = response.choices[0];

            if (message?.function_call) {
                const { name, arguments: args } = message!.function_call!;

                const parsedArgs = JSON.parse(args!) as QAPair;

                messageList.push(message);

                messageList.push({
                    role: "function",
                    content: JSON.stringify(parsedArgs),
                    name: message?.function_call.name
                });

            responses.push(parsedArgs);
            } else {
                break;
            }
        }

        return { responses, messages: messageList };
    }
}

export default OpenAIClient.getInstance();

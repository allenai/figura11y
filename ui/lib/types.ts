import { Message } from "@/lib/openai-client";
import { Figure } from "./db-schema";

/**
 * Image dimensions.
 *
 * @export
 * @interface ImageDimensions
 * @typedef {ImageDimensions}
 *
 * @property {number} width - The width of the image.
 * @property {number} height - The height of the image.
 */
export interface ImageDimensions {
    width: number,
    height: number
}

/**
 * Convenience type for permitted OpenAI models.
 *
 * @export
 * @typedef {OpenAIModel}
 */
export type OpenAIModel = "gpt-4-0613" | "gpt-3.5-turbo-0613";

/**
 * Basic parameters to request a suggestion, including the figure metadata.
 *
 * @export
 * @interface SuggestionRequest
 * @typedef {SuggestionRequest}
 * @extends {FigureInfo}
 *
 * @property {string} caption - The figure caption.
 * @property {string} mentions_paragraphs - The figure mentions.
 * @property {string} figure_type - The figure type.
 * @property {string} ocr_text - The OCR-recognized figure text.
 * @property {string} data_table - The extracted figure data table.
 * @property {ImageDimensions} dimensions - The figure dimensions.
 * @property {string} base64_encoded - The figure image data.
 * @property {string} description - The description (so far).
 * @property {string} customPrompt - The custom prompt (if the user entered one).
 * @property {?OpenAIModel} model - The OpenAI model to use.
 * @property {?Message[]} messages - The message history.
 */
export interface SuggestionRequest extends Figure {
    description: string;
    descriptionContext?: string;
    customPrompt: string;
    model?: OpenAIModel;
    messages?: Message[];
}

/**
 * A question answer pair.
 *
 * @export
 * @interface QAPair
 * @typedef {QAPair}
 *
 * @property {string} question - The question.
 * @property {?string} suggested_answer - The model's suggested answer.
 */
export interface QAPair {
    question: string;
    suggested_answer?: string;
    suggested_answer1?: string;
    suggested_answer2?: string;
    suggested_answer3?: string;
    suggested_answer4?: string;
}

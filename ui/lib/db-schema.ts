import { SettingsState } from "@/context/settings-context";
import { QAPair } from "@/lib/types";

/**
 * Base model implementing the primary key (id) for all models.
 *
 * @export
 * @interface Base
 * @typedef {Base}
 */
export interface Base {
    id: number;
}

/**
 * Model for user-related metadata.
 *
 * @export
 * @interface User
 * @typedef {User}
 * @extends {Base}
 *
 * @property {string} username - The user's username.
 * @property {Date} date_first_interacted - The date the user first interacted with the app.
 * @property {number | null} activedescription_id - The id of the user's active description.
 * @property {Description[]} descriptions - The user's descriptions.
 * @property {Suggestions[]} suggestions - The user's suggestions.
 * @property {Settings[]} settings - The user's settings.
 */
export interface User extends Base {
    g_id: string;
    username: string;
    date_first_interacted: Date;
    activedescription_id: number | null;
    descriptions: Description[];
    suggestions: Suggestions[];
    settings: Settings[];
}

/**
 * Model for paper PDF related metadata.
 *
 * @export
 * @interface Paper
 * @typedef {Paper}
 * @extends {Base}
 *
 * @property {Blob} pdf_file - The paper's PDF file.
 * @property {string} filename - The paper's filename.
 * @property {string} title - The paper's title.
 * @property {string} authors - The paper's authors.
 * @property {Date} date_uploaded - The date the paper was uploaded.
 * @property {number} user_id - The id of the user who uploaded the paper.
 * @property {Figure[]} figures - The paper's extracted figures.
 * @property {Description[]} descriptions - The paper's user-authored descriptions so far.
 */
export interface Paper extends Base {
    pdf_file: string;
    filename: string;
    title: string;
    authors: string;
    date_uploaded: string;
    user_id: number;
    figures: Figure[];
    descriptions: Description[];
}

/**
 * Model for extracted figures and metadata.
 *
 * @export
 * @interface Figure
 * @typedef {Figure}
 * @extends {Base}
 *
 * @property {string} base64_encoded - The figure's base64 encoded image.
 * @property {string} filename - The figure's filename.
 * @property {string} dimensions - The figure's dimensions.
 * @property {string} ocr_text - The figure's OCR text.
 * @property {string} figure_type - The figure's type.
 * @property {string} caption - The figure's caption.
 * @property {string} mentions_paragraphs - The figure's mentioned paragraphs.
 * @property {number} user_id - The id of the user who uploaded the figure.
 * @property {number} description_id - The id of the description the figure belongs to.
 * @property {number} paper_id - The id of the paper the figure belongs to.
 */
export interface Figure extends Base {
    base64_encoded: string;
    filename: string;
    dimensions: string;
    ocr_text: string;
    figure_type: string;
    caption: string;
    mentions_paragraphs: string;
    data_table: string;
    user_id: number;
    description_id: number;
    paper_id: number;
}

/**
 * Model for authored descriptions plus their historical state.
 *
 * @export
 * @interface Description
 * @typedef {Description}
 * @extends {Base}
 *
 * @property {string} current_string - The description's current string.
 * @property {string} current_html - The description's current HTML.
 * @property {any[]} history - The description's historical state.
 * @property {string} summarized_version - The description's summarized version.
 * @property {boolean} study_session - Whether the description was authored during a lab study session.
 * @property {string} condition - The experimental condition ("full" by default).
 * @property {number} user_id - The id of the user who authored the description.
 * @property {number} figure_id - The id of the figure being described.
 * @property {number} paper_id - The id of the paper the described figure is from.
 */
export interface Description extends Base {
    current_string: string;
    current_html: string;
    history: any[];
    summarized_version: string;
    study_session: boolean;
    condition: string;
    user_id: number;
    figure_id: number;
    paper_id: number;
}

/**
 * Model for user settings plus their historical state.
 *
 * @export
 * @interface Settings
 * @typedef {Settings}
 * @extends {Base}
 *
 * @property {SettingsState} current_settings - The settings' current state.
 * @property {Date} last_changed - The date the settings were last changed.
 * @property {(SettingsState & { date: Date })[]} history - The settings' historical state.
 * @property {number} user_id - The id of the user whose settings these are.
 */
export interface Settings extends Base {
    current_settings: SettingsState;
    last_changed: Date;
    history: (SettingsState & { date: Date })[];
    study_session: boolean;
    user_id: number;
    figure_id: number;
}

/**
 * Model for suggestions provided to users during description authoring process.
 *
 * @export
 * @interface Suggestions
 * @typedef {Suggestions}
 * @extends {Base}
 *
 * @property {(string | QAPair)} content - The suggestion's content.
 * @property {string} suggestion_type - The suggestion's type.
 * @property {string} model - The model used to generate the suggestion.
 * @property {string} text_context - The description context thus far, used to generate the suggestion.
 * @property {number} description_id - The id of the description the suggestion is for.
 * @property {number} user_id - The id of the user who authored the description and received the suggestion.
 */
export interface Suggestions extends Base {
    content: string | QAPair;
    suggestion_type: string;
    model: string;
    text_context: string;
    date_suggested: Date;
    study_session: boolean;
    description_id: number;
    user_id: number;
}

/**
 * Model for capturing user events during interactions.
 *
 * @export
 * @interface Event
 * @typedef {Event}
 * @extends {Base}
 *
 * @property {number} user_id - The id of the associated user.
 * @property {number} figure_id - The id of the associated figure.
 * @property {number} description_id - The id of the associated description.
 * @property {boolean} study_session - Indicates whether this is part of a study session.
 * @property {string} condition - The experimental condition ("full" by default).
 * @property {string} event_type - Type of the event being logged.
 * @property {Object} event_data - Additional JSON data for the event.
 * @property {Date} event_time - The time when the event occurred.
 */
export interface Event extends Base {
    user_id: number;
    figure_id: number;
    description_id: number;
    study_session: boolean;
    condition: string;
    event_type: string;
    event_data: Object;
    event_time: Date;
}

/**
 * Model for generated descriptions for figures.
 *
 * @export
 * @interface GeneratedDescription
 * @typedef {GeneratedDescription}
 * @extends {Base}
 *
 * @property {string} description - The generated description text.
 * @property {string} model - The model used to generate the description.
 * @property {number} figure_id - The id of the figure for which the description was generated.
 */
export interface GeneratedDescription extends Base {
    description: string;
    model: string;
    figure_id: number;
}

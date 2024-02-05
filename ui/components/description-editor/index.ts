/**
 * DescriptionEditor
 * @packageDocumentation
 * @module DescriptionEditor
 * @preferred
 * @description
 * This is the main entry point for the DescriptionEditor component.
 * The DescriptionEditor component is a rich text editor that allows users to create and edit descriptions.
 * It provides suggestions in the forms of completions and Q&A type interactions.
*/

import DescriptionEditor from "./description-editor";
import BaseEditor from "./base-editor";

import ImageDisplay from "./image-display";
import PromptDataAccordion from "./prompt-data-accordion";
import DescriptionEditorToolbar from "./description-editor-toolbar";
import SuggestionPopover from "./suggestion-popover";
import SummaryModal from "./summary-modal";
import QASuggestionsView from "./qa-suggestions-view";

export default DescriptionEditor;

export {
    ImageDisplay,
    PromptDataAccordion,
    DescriptionEditorToolbar,
    SuggestionPopover,
    SummaryModal,
    QASuggestionsView,
    BaseEditor
};

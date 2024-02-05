import React, { createContext, useReducer, useEffect, Dispatch } from "react";
import { OpenAIModel } from "@/lib/types";

/**
 * Types for elements in the global app settings.
 *
 * @interface SettingsState
 * @typedef {SettingsState}
 *
 * @property {OpenAIModel} model - The model to use.
 * @property {string} customPrompt - The custom prompt to use, if the user specified one.
 * @property {boolean} shouldUseFigureText - Whether to use the OCR-recognized figure text when generating suggestions.
 * @property {boolean} shouldUseFigureCaption - Whether to use the figure caption when generating suggestions.
 * @property {boolean} shouldUseFigureMentions - Whether to use the figure mentions when generating suggestions.
 * @property {boolean} shouldUseFigureType - Whether to use the detected figure type when generating suggestions.
 */
export interface SettingsState {
    model: OpenAIModel;
    customPrompt: string;
    shouldUseFigureText: boolean;
    shouldUseFigureCaption: boolean;
    shouldUseFigureMentions: boolean;
    shouldUseDataTable: boolean;
}

/**
 * Types for the actions that can be dispatched to the settings reducer.
 *
 * @interface Action
 * @typedef {Action}
 *
 * @property {string} type - The type of action to dispatch.
 * @property {?*} payload - The payload to dispatch along with the action.
 */
interface Action {
    type: string;
    payload?: any;
}

/**
 * Initial state for the settings reducer.
 *
 * @type {SettingsState}
 */
const initialState: SettingsState = {
    model: "gpt-4-0613",
    customPrompt: "",
    shouldUseFigureText: true,
    shouldUseFigureCaption: true,
    shouldUseFigureMentions: true,
    shouldUseDataTable: true
};

/**
 * Context for the global app settings.
 *
 * @type {React.Context<[SettingsState, Dispatch<Action>]>}
 */
const SettingsContext = createContext<[SettingsState, Dispatch<Action>]>([initialState, () => {}]);

/**
 * Reducer for the global app settings.
 *
 * @param {SettingsState} state - The current state.
 * @param {Action} action - The action to dispatch.
 * @returns {SettingsState} The new state.
 */
const settingsReducer = (state: SettingsState, action: Action): SettingsState => {
    switch (action.type) {
        case "SET_MODEL": // Set model to use.
            return { ...state, model: action.payload };
        case "SET_CUSTOM_PROMPT": // Set user-entered custom prompt to use.
            return { ...state, customPrompt: action.payload };
        case "SET_USE_FIGURE_TEXT": // Set whether to use the OCR-recognized figure text when generating new suggestions.
            return { ...state, shouldUseFigureText: action.payload };
        case "SET_USE_FIGURE_CAPTION": // Set whether to use the figure caption when generating new suggestions.
            return { ...state, shouldUseFigureCaption: action.payload };
        case "SET_USE_FIGURE_MENTIONS": // Set whether to use the figure mentions when generating new suggestions.
            return { ...state, shouldUseFigureMentions: action.payload };
        case "SET_USE_DATA_TABLE": // Set whether to use the extracted data table when generating new suggestions.
            return { ...state, shouldUseDataTable: action.payload };
        default:
            return state;
    }
};

/**
 * SettingsProvider props.
 *
 * @interface SettingsProviderProps
 * @typedef {SettingsProviderProps}
 *
 * @property {React.ReactNode} children - The children to render.
 */
interface SettingsProviderProps {
    children: React.ReactNode;
}

/**
 * A component to provide global app settings to the app.
 *
 * @param {SettingsProviderProps} props - Props containing the children to render (see {@link SettingsProviderProps}).
 */
const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [settings, dispatch] = useReducer(settingsReducer, initialState, () => {
        // If we're in the browser, load settings from local storage.
        if (typeof window !== "undefined") {
            const localData = sessionStorage.getItem("settings");
            return localData ? JSON.parse(localData) : initialState;
        }
        return initialState;
    });

    useEffect(() => {
        // If we're in the browser, store settings to local storage when changed.
        if (typeof window !== "undefined") {
            sessionStorage.setItem("settings", JSON.stringify(settings));
        }
    }, [settings]);

    return (
        <SettingsContext.Provider value={[settings, dispatch]}>
            {children}
        </SettingsContext.Provider>
    );
};

export { SettingsContext, SettingsProvider };

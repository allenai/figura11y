import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Paper, Figure, Description, Settings, Suggestions } from "@/lib/db-schema";
import APIClient from "@/lib/api-client";
import DBClient from "@/lib/db-client";

/**
 * A wrapper around Zustand's store hook that allows for the store to be
 * initialized asynchronously. This avoids hydration issues in Next.js
 * where the server and the clients disagree in condtional rendering situations.
 *
 * @param store - Zustand store
 * @param callback - Callback function that returns data to be used
 * @returns {F}
 */
export const useStore = <T, F>(
    store: (callback: (state: T) => unknown) => unknown,
    callback: (state: T) => F
) => {
    const result = store(callback) as F;
    const [data, setData] = useState<F>();

    useEffect(() => {
        setData(result);
    }, [result]);

    return data;
};

// Convenience types for initializing stores from incomplete data.
type CurrentUser = Partial<User>;
type CurrentPaper = Partial<Paper>;
type CurrentFigure = Partial<Figure>;
type CurrentDescription = Partial<Description>;
type CurrentSettings = Partial<Settings>;
type CurrentSuggestions = Partial<Suggestions>;

/**
 * Type for user store.
 *
 * @interface UserStore
 * @typedef {UserStore}
 *
 * @property {(User | null)} user - The current stored user
 * @property {(initialUser: CurrentUser) => Promise<void>} initialize - Initializes the user from partial information
 * @property {(user: CurrentUser) => Promise<void>} updateUser - Updates user
 * @property {() => void} clearUser - Clears the user store
 */
interface UserStore {
    user: User | null;
    initialize: (initialUser: CurrentUser) => Promise<void>;
    updateUser: (user: CurrentUser) => Promise<void>;
    clearUser: () => void;
}

/**
 * User store.
 *
 * @type {*}
 */
export const useUserStore = create<UserStore>()(
    (set, get) => ({
        user: null,
        initialize: async (initialUser: CurrentUser) => {
            if (!initialUser) {
                return;
            }
            // Initialize from partial information
            const user: User = await DBClient.addUserOrUpdate(initialUser);
            set((state) => ({ ...state, user }));
        },
        updateUser: async (user: CurrentUser) => {
            const updatedUser: User = await DBClient.addUserOrUpdate(user);
            set((state) => ({ ...state, user: updatedUser }));
        },
        clearUser: () => set((state) => ({ ...state, user: null }))
    })
);

/**
 * Type for paper store.
 *
 * @interface PaperStore
 * @typedef {PaperStore}
 *
 * @property {(Paper | null)} paper - The current stored paper
 * @property {(initialPaper: CurrentPaper) => Promise<void>} initialize - Initializes the paper from partial information
 * @property {(paper: Paper) => void} setPaper - Sets the stored paper
 * @property {(paper: Paper) => Promise<void>} updatePaper - Updates paper
 * @property {() => void} clearPaper - Clears the paper store
 */
interface PaperStore {
    paper: Paper | null;
    initialize: (initialPaper: CurrentPaper) => Promise<void>;
    setPaper: (paper: Paper) => void;
    updatePaper: (paper: Paper) => Promise<void>;
    clearPaper: () => void;
}

/**
 * Paper store.
 *
 * @type {*}
 */
export const usePaperStore = create<PaperStore>()(
    persist(
        (set, get) => ({
            paper: null,
            initialize: async (initialPaper: CurrentPaper) => {
                // Initialize from partial information
                const paper: Paper = await DBClient.addPaperOrUpdate(initialPaper);
                set((state) => ({ ...state, paper }));
            },
            setPaper: (paper: Paper) => set((state) => ({ ...state, paper })),
            updatePaper: async (paper: Paper) => {
                if (!get().paper) throw new Error("Paper is not initialized");
                const updatedPaper: Paper = await DBClient.addPaperOrUpdate(paper);
                set((state) => ({ ...state, paper: updatedPaper }));
            },
            clearPaper: () => set((state) => ({ ...state, paper: null }))
        }),
        {
            name: "paper-storage",
            getStorage: () => sessionStorage,
            partialize: (state) => ({ ...state, paper: { ...state.paper, pdf_file: null } }),
            onRehydrateStorage: (state) => {
                if (state && state.paper) {
                    // We need to reinitialize the paper to get the pdf_file
                    // We don't store pdf files in sessionStorage because they are too large
                    state.initialize(state.paper);
                }
            }
        }
    )
);

/**
 * Type for figure store.
 *
 * @interface FigureStore
 * @typedef {FigureStore}
 *
 * @property {(Figure | null)} figure - The current stored figure
 * @property {(initialFigure: CurrentFigure) => Promise<void>} initialize - Initializes the figure from partial information
 * @property {(figure: Figure) => void} setFigure - Sets the stored figure
 * @property {(figure: Figure) => Promise<void>} updateFigure - Updates figure
 * @property {() => void} clearFigure - Clears the figure store
 */
interface FigureStore {
    figure: Figure | null;
    initialize: (initialFigure: CurrentFigure, reprocess?: boolean) => Promise<void>;
    setFigure: (figure: Figure) => void;
    updateFigure: (figure: Figure) => Promise<void>;
    clearFigure: () => void;
}

/**
 * Figure store.
 *
 * @type {*}
 */
export const useFigureStore = create<FigureStore>()(
    persist(
        (set, get) => ({
            figure: null,
            initialize: async (initialFigure: CurrentFigure, reprocess: boolean = false) => {
                // First, try to get the existing figure from the database
                let figure: Partial<Figure> = await DBClient.addFigureOrUpdate(initialFigure);
                if (!figure.ocr_text || reprocess) {
                    // Preprocess if this does not seem to be already done
                    document.body.style.cursor = "wait";
                    figure = await APIClient.preprocessFigure(figure);
                    document.body.style.cursor = "default";
                    await DBClient.addFigureOrUpdate(figure);
                }
                if (figure.id) {
                    set((state) => ({ ...state, figure: figure as Figure }));
                }
            },
            setFigure: (figure: Figure) => set((state) => ({ ...state, figure })),
            updateFigure: async (figure: CurrentFigure) => {
                if (!get().figure) throw new Error("Figure is not initialized");
                const updatedFigure: Figure = await DBClient.addFigureOrUpdate(figure);
                set((state) => ({ ...state, figure: updatedFigure }));
            },
            clearFigure: () => set((state) => ({ ...state, figure: null }))
        }),
        {
            name: "figure-storage",
            getStorage: () => sessionStorage
        }
    )
);

/**
 * Type for description store.
 *
 * @interface DescriptionStore
 * @typedef {DescriptionStore}
 *
 * @property {(Description | null)} description - The current stored description
 * @property {(initialDescription: CurrentDescription) => Promise<void>} initialize - Initializes the description from partial information
 * @property {(description: Description) => void} setDescription - Sets the stored description
 * @property {(description: Description) => Promise<void>} updateDescription - Updates description
 * @property {() => void} clearDescription - Clears the description store
 */
interface DescriptionStore {
    description: Description | null;
    initialize: (initialDescription: CurrentDescription) => Promise<void>;
    setDescription: (description: Description) => void;
    updateDescription: (description: Description) => Promise<void>;
    clearDescription: () => void;
}

/**
 * Description store.
 *
 * @type {*}
 */
export const useDescriptionStore = create<DescriptionStore>()(
    persist(
        (set, get) => ({
            description: null,
            initialize: async (initialDescription: CurrentDescription) => {
                // First, try to get the existing description from the database
                // We use the figure ID to do this
                if (initialDescription.figure_id) {
                    const figureDescription: Description = await DBClient.getDescriptionByFigureId(
                        initialDescription.figure_id
                    );

                    if (figureDescription.id) {
                        set((state) => ({ ...state, description: figureDescription }));
                        return;
                    }
                }
                // If we don't have a figure ID, or if we can't find the description
                // then we add a new one
                const description: Description = await DBClient.addDescriptionOrUpdate(
                    initialDescription
                );

                if (description.id) {
                    set((state) => ({ ...state, description }));
                }
            },
            setDescription: (description: Description) => set(
                (state) => ({ ...state, description })
            ),
            updateDescription: async (description: Description) => {
                if (!get().description) throw new Error("Description is not initialized");
                const updatedDescription: Description = await DBClient.addDescriptionOrUpdate(
                    description
                );
                set((state) => ({ ...state, description: updatedDescription }));
            },
            clearDescription: () => set((state) => ({ ...state, description: null }))
        }),
        {
            name: "description-storage",
            getStorage: () => sessionStorage
        }
    )
);

/**
 * Type for settings store.
 *
 * @interface SettingsStore
 * @typedef {SettingsStore}
 */
interface SettingsStore {
    settings: Settings | null;
    setSettings: (settings: Settings) => void;
    updateSettings: (settings: Settings) => void;
    clearSettings: () => void;
}

/**
 * Settings store.
 *
 * @type {*}
 */
export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            settings: null,
            initialize: async (userID: number) => {
                // First, try to get the existing settings from the database
                const userSettings: Settings = await DBClient.getSettingsByUserId(userID);
                if (userSettings.id) {
                    set((state) => ({ ...state, settings: userSettings }));
                } else {
                    // If we don't have existing settings, then we add a new one
                    const newSettings: CurrentSettings = {
                        current_settings: {
                            model: "gpt-4-0613",
                            customPrompt: "",
                            shouldUseFigureText: true,
                            shouldUseFigureCaption: true,
                            shouldUseFigureMentions: true,
                            shouldUseDataTable: true
                        },
                        last_changed: new Date(),
                        history: [],
                        user_id: userID
                    };
                    const settings: Settings = await DBClient.addSettingsOrUpdate(newSettings);
                    set((state) => ({ ...state, settings }));
                }
            },
            setSettings: (settings: Settings) => set((state) => ({ ...state, settings })),
            updateSettings: async (settings: Settings) => {
                if (!get().settings) throw new Error("Settings is not initialized");
                const updatedSettings: Settings = await DBClient.addSettingsOrUpdate(settings);
                set((state) => ({ ...state, settings: updatedSettings }));
            },
            clearSettings: () => set((state) => ({ ...state, settings: null }))
        }),
        {
            name: "settings-storage",
            getStorage: () => sessionStorage
        }
    )
);

/**
 * Type for suggestions store.
 *
 * @interface SuggestionsStore
 * @typedef {SuggestionsStore}
 */
interface SuggestionsStore {
    suggestions: Suggestions[],
    initialize: (figureID: number) => Promise<void>;
    addSuggestion: (suggestion: CurrentSuggestions) => Promise<void>;
    clearSuggestions: () => void;
}

/**
 * Suggestions store.
 *
 * @type {*}
 */
export const useSuggestionsStore = create<SuggestionsStore>()(
    persist(
        (set, get) => ({
            suggestions: [],
            initialize: async (descriptionID: number) => {
                const suggestions: Suggestions[] = await DBClient.getSuggestionsByDescriptionId(
                    descriptionID
                );
                set((state) => ({ ...state, suggestions: suggestions.length ? suggestions : [] }));
            },
            addSuggestion: async (suggestion: CurrentSuggestions) => {
                // We handle this with an append like action
                const newSuggestion: Suggestions = await DBClient.addSuggestionsOrUpdate(
                    suggestion
                );
                set((state) => ({ ...state, suggestions: [...state.suggestions, newSuggestion] }));
            },
            clearSuggestions: () => set((state) => ({ ...state, suggestions: [] }))
        }),
        {
            name: "suggestions-storage",
            getStorage: () => sessionStorage
        }
    )
);

export default {
    useUserStore,
    usePaperStore,
    useFigureStore,
    useDescriptionStore,
    useSettingsStore,
    useSuggestionsStore
};

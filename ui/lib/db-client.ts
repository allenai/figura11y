import { User, Paper, Figure, Description, Settings, Suggestions, Event, GeneratedDescription } from "@/lib/db-schema";

/**
 * The base URI for the backend database API.
 *
 * @type {string}
 */
const BASE_URI = "/backendapi/db";

/**
 * The HTTP methods supported by the backend API.
 *
 * @typedef {HttpMethod}
 */
type HttpMethod = "get" | "post" | "put" | "delete";

/**
 * The base resource routes for the database client.
 *
 * @typedef {RouteResource}
 */
type RouteResource = "/user" | "/paper" | "/figure" | "/description" | "/settings" | "/suggestions";

/**
 * Types of resources, building on each base route.
 *
 * @interface ResourceRoutes
 * @typedef {ResourceRoutes}
 *
 * @property {RouteResource} base - The base route for the resource.
 * @property {(id: number) => string} byId - The route for the resource by ID.
 * @property {(userId: number) => string} byUserId - The route for the resource by user ID.
 * @property {?(paperId: number) => string} byPaperId - The route for the resource by paper ID (if applicable).
 * @property {?(figureId: number) => string} byFigureId - The route for the resource by figure ID (if applicable).
 * @property {?(descriptionId: number) => string} byDescriptionId - The route for the resource by description ID (if applicable).
 */
interface ResourceRoutes {
    base: RouteResource;
    byId: (id: number) => string;
    byUserId: (userId: number) => string;
    byPaperId: (paperId: number) => string;
    byFigureId: (figureId: number) => string;
    byDescriptionId: (descriptionId: number) => string;
}

/**
 * A helper function to make database related requests to the backend API.
 * Provides a useFetch-like API.
 *
 * @param route - The route to the resource.
 * @returns {Object} - An object containing methods for each HTTP method.
 */
function makeRequest<T>(route: string, baseUri: string = BASE_URI): {
    get: () => Promise<T>;
    post: (body: any) => Promise<T>;
    put: (body: any) => Promise<T>;
    del: () => Promise<T>;
} {
    const commonHeaders = {
        "Content-Type": "application/json"
    };

    const fetchOptions = (method: HttpMethod, body?: any) => ({
        method: method.toUpperCase(),
        headers: commonHeaders,
        body: body ? JSON.stringify(body) : undefined
    });

    const request = async (method: HttpMethod, body?: any): Promise<T> => {
        const response = await fetch(
            `${baseUri}${route}`,
            fetchOptions(method, body)
        );
        if (!response.ok) {
            console.error(`Error with status ${response.status}`); // TODO: handle error in the UI
        }
        const result: T = await response.json();
        return result;
    };

    return {
        get: async () => request("get"),
        post: async (body: any) => request("post", body),
        put: async (body: any) => request("put", body),
        del: async () => request("delete")
    };
}

interface UserRoutes extends Omit<ResourceRoutes, "byUserId" | "byPaperId" | "byFigureId" | "byDescriptionId"> {
    byGoogleId: (googleId: string) => string;
}

/**
 * The routes for the database client, combining the base routes with different route types.
 * We use Omit<> to remove the routes that are not applicable to each resource.
 * For example, the user resource does not support a query by paper ID, so we remove it from the type.
 *
 * TODO: replace this with a more elegant solution
 *
 * @interface DBClientRoutes
 * @typedef {DBClientRoutes}
 */
interface DBClientRoutes {
    user: UserRoutes;
    paper: Omit<ResourceRoutes, "byPaperId" | "byFigureId" | "byDescriptionId">;
    figure: Omit<ResourceRoutes, "byFigureId" | "byDescriptionId">;
    description: Omit<ResourceRoutes, "byDescriptionId">;
    settings: Omit<ResourceRoutes, "byPaperId" | "byFigureId" | "byDescriptionId">;
    suggestions: Omit<ResourceRoutes, "byPaperId" | "byFigureId">;
}

/**
 * The routes for the database client, combining the base routes with different route types.
 *
 * @type {DBClientRoutes}
 *
 * @property {ResourceRoutes} user - The routes relating to all users (base) and a specific user (byId).
 * @property {ResourceRoutes} paper - The routes relating to all papers (base), a specific paper (byId), and papers by user (byUserId).
 * @property {ResourceRoutes} figure - The routes relating to all figures (base), a specific figure (byId), figures by user (byUserId), and figures by paper (byPaperId).
 * @property {ResourceRoutes} description - The routes relating to all descriptions (base), a specific description (byId), descriptions by user (byUserId), descriptions by figure (byFigureId), and descriptions by paper (byPaperId).
 * @property {ResourceRoutes} settings - The routes relating to all settings (base), a specific instance (byId), and settings by user (byUserId).
 * @property {ResourceRoutes} suggestions - The routes relating to all suggestions (base), a specific suggestion (byId), suggestions by user (byUserId), and suggestions by description (byDescriptionId).
 */
const DBClientRoutes: DBClientRoutes = {
    user: {
        base: "/user",
        byId: (id: number) => `/user/${id}`,
        byGoogleId: (googleId: string) => `/user/google/${googleId}`
    },
    paper: {
        base: "/paper",
        byId: (id: number) => `/paper/${id}`,
        byUserId: (userId: number) => `/paper/user/${userId}`
    },
    figure: {
        base: "/figure",
        byId: (id: number) => `/figure/${id}`,
        byUserId: (userId: number) => `/figure/user/${userId}`,
        byPaperId: (paperId: number) => `/figure/paper/${paperId}`
    },
    description: {
        base: "/description",
        byId: (id: number) => `/description/${id}`,
        byUserId: (userId: number) => `/description/user/${userId}`,
        byFigureId: (figureId: number) => `/description/figure/${figureId}`,
        byPaperId: (paperId: number) => `/description/paper/${paperId}`
    },
    settings: {
        base: "/settings",
        byId: (id: number) => `/settings/${id}`,
        byUserId: (userId: number) => `/settings/user/${userId}`
    },
    suggestions: {
        base: "/suggestions",
        byId: (id: number) => `/suggestions/${id}`,
        byUserId: (userId: number) => `/suggestions/user/${userId}`,
        byDescriptionId: (descriptionId: number) => `/suggestions/description/${descriptionId}`
    }
};

/**
 * A singleton class to manage interactions with the (Postgres) database.
 *
 * @class DBClient
 * @typedef {DBClient}
 */
class DBClient {
    private static instance: DBClient;

    private constructor() { }

    /**
     * Get the instance of the DBClient.
     *
     * @public
     * @static
     * @returns {DBClient}
     */
    public static getInstance(): DBClient {
        if (!DBClient.instance) {
            DBClient.instance = new DBClient();
        }
        return DBClient.instance;
    }

    // User
    /**
     * Get a user record.
     *
     * @public
     * @async
     * @param {number} id - The ID of the user to retrieve.
     * @returns {Promise<User>} - The user record.
     */
    public async getUser(id: number): Promise<User> {
        const { get } = makeRequest<User>(DBClientRoutes.user.byId(id));
        return get();
    }

    /**
     * Add a user record or update an existing one (handled by the backend API).
     *
     * @public
     * @async
     * @param {Partial<User>} user - The user record to add or update.
     * @returns {Promise<User>} - The user record.
     */
    public async addUserOrUpdate(user: Partial<User>): Promise<User> {
        const { post } = makeRequest<User>(DBClientRoutes.user.byGoogleId(user.g_id!));
        return post(user);
    }

    /**
     * Delete a user record.
     *
     * @public
     * @async
     * @param {number} userId - The ID of the user to delete.
     * @returns {Promise<void>} - A promise that resolves when the user is deleted.
     */
    public async deleteUser(userId: number): Promise<void> {
        const { del } = makeRequest<void>(DBClientRoutes.user.byId(userId));
        await del();
    }

    // Paper
    /**
     * Get all paper records.
     *
     * @public
     * @async
     * @returns {Promise<Paper[]>} - The paper records.
     */
    public async getPapers(): Promise<Paper[]> {
        const { get } = makeRequest<Paper[]>(DBClientRoutes.paper.base);
        return get();
    }

    /**
     * Get a paper record.
     *
     * @public
     * @async
     * @param {number} paperId - The ID of the paper to retrieve.
     * @returns {Promise<Paper>} - The paper record.
     */
    public async getPaper(paperId: number): Promise<Paper> {
        const { get } = makeRequest<Paper>(DBClientRoutes.paper.byId(paperId));
        return get();
    }

    /**
     * Add a paper record or update an existing one (handled by the backend API).
     *
     * @public
     * @async
     * @param {Paper} paper - The paper record to add or update.
     * @returns {Promise<Paper>} - The paper record.
     */
    public async addPaperOrUpdate(paper: Partial<Paper>): Promise<Paper> {
        const { post } = makeRequest<Paper>(DBClientRoutes.paper.base);
        return post(paper);
    }

    /**
     * Delete a paper record.
     *
     * @public
     * @async
     * @param {number} paperId - The ID of the paper to delete.
     * @returns {Promise<void>} - A promise that resolves when the paper is deleted.
     */
    public async deletePaper(paperId: number): Promise<void> {
        const { del } = makeRequest<void>(DBClientRoutes.paper.byId(paperId));
        await del();
    }

    /**
     * Get all papers for a user.
     *
     * @public
     * @async
     * @param {number} userId - The ID of the user to retrieve papers for.
     * @returns {Promise<Paper[]>} - The paper records.
     */
    public async getPapersByUserId(userId: number): Promise<Paper[]> {
        const { get } = makeRequest<Paper[]>(DBClientRoutes.paper.byUserId(userId));
        return get();
    }

    // Figure
    /**
     * Get a figure record.
     *
     * @public
     * @async
     * @param {number} figureId - The ID of the figure to retrieve.
     * @returns {Promise<Figure>} - The figure record.
     */
    public async getFigure(figureId: number): Promise<Figure> {
        const { get } = makeRequest<Figure>(DBClientRoutes.figure.byId(figureId));
        return get();
    }

    /**
     * Add a figure record or update an existing one (handled by the backend API).
     *
     * @public
     * @async
     * @param {Figure} figure - The figure record to add or update.
     * @returns {Promise<Figure>} - The figure record.
     */
    public async addFigureOrUpdate(figure: Partial<Figure>): Promise<Figure> {
        const { post } = makeRequest<Figure>(DBClientRoutes.figure.base);
        return post(figure);
    }

    /**
     * Delete a figure record.
     *
     * @public
     * @async
     * @param {number} figureId - The ID of the figure to delete.
     * @returns {Promise<void>} - A promise that resolves when the figure is deleted.
     */
    public async deleteFigure(figureId: number): Promise<void> {
        const { del } = makeRequest<void>(DBClientRoutes.figure.byId(figureId));
        await del();
    }

    /**
     * Get all figures for a user.
     *
     * @public
     * @async
     * @param {number} userId - The ID of the user to retrieve figures for.
     * @returns {Promise<Figure[]>} - The figure records.
     */
    public async getFiguresByUserId(userId: number): Promise<Figure[]> {
        const { get } = makeRequest<Figure[]>(DBClientRoutes.figure.byUserId(userId));
        return get();
    }

    /**
     * Get all figures from a paper.
     *
     * @public
     * @async
     * @param {number} paperId - The ID of the paper to retrieve figures for.
     * @returns {Promise<Figure[]>} - The figure records.
     */
    public async getFiguresByPaperId(paperId: number): Promise<Figure[]> {
        const { get } = makeRequest<Figure[]>(DBClientRoutes.figure.byPaperId(paperId));
        return get();
    }

    // Description
    /**
     * Get a description record by ID.
     *
     * @public
     * @async
     * @param {number} descriptionId - The ID of the description to retrieve.
     * @returns {Promise<Description>} - The description record.
     */
    public async getDescription(descriptionId: number): Promise<Description> {
        const { get } = makeRequest<Description>(DBClientRoutes.description.byId(descriptionId));
        return get();
    }

    /**
     * Add a description record or update an existing one (handled by the backend API).
     *
     * @public
     * @async
     * @param {Description} description - The description record to add or update.
     * @returns {Promise<Description>} - The description record.
     */
    public async addDescriptionOrUpdate(description: Partial<Description>): Promise<Description> {
        const { post } = makeRequest<Description>(DBClientRoutes.description.base);
        return post(description);
    }

    /**
     * Delete a description record by ID.
     *
     * @public
     * @async
     * @param {number} descriptionId - The ID of the description to delete.
     * @returns {Promise<void>} - A promise that resolves when the description is deleted.
     */
    public async deleteDescription(descriptionId: number): Promise<void> {
        const { del } = makeRequest<void>(DBClientRoutes.description.byId(descriptionId));
        await del();
    }

    /**
     * Get all descriptions for a user.
     *
     * @public
     * @async
     * @param {number} userId - The ID of the user to retrieve descriptions for.
     * @returns {Promise<Description[]>} - The description records.
     */
    public async getDescriptionsByUserId(userId: number): Promise<Description[]> {
        const { get } = makeRequest<Description[]>(DBClientRoutes.description.byUserId(userId));
        return get();
    }

    /**
     * Get a figure's description record (if already authored).
     *
     * @public
     * @async
     * @param {number} figureId - The ID of the figure to retrieve the description for.
     * @returns {Promise<Description>} - The description record.
     */
    public async getDescriptionByFigureId(figureId: number): Promise<Description> {
        const { get } = makeRequest<Description>(DBClientRoutes.description.byFigureId(figureId));
        return get();
    }

    /**
     * Get all descriptions from a paper.
     *
     * @public
     * @async
     * @param {number} paperId - The ID of the paper to retrieve descriptions for.
     * @returns {Promise<Description[]>} - The description records.
     */
    public async getDescriptionsByPaperId(paperId: number): Promise<Description[]> {
        const { get } = makeRequest<Description[]>(DBClientRoutes.description.byPaperId(paperId));
        return get();
    }

    // Settings
    /**
     * Get a settings record by ID.
     *
     * @public
     * @async
     * @param {number} settingsId - The ID of the settings to retrieve.
     * @returns {Promise<Settings>} - The settings record.
     */
    public async getSettings(settingsId: number): Promise<Settings> {
        const { get } = makeRequest<Settings>(DBClientRoutes.settings.byId(settingsId));
        return get();
    }

    /**
     * Add a settings record or update an existing one (handled by the backend API).
     *
     * @public
     * @async
     * @param {Settings} settings - The settings record to add or update.
     * @returns {Promise<Settings>} - The settings record.
     */
    public async addSettingsOrUpdate(settings: Partial<Settings>): Promise<Settings> {
        const { post } = makeRequest<Settings>(DBClientRoutes.settings.base);
        return post(settings);
    }

    /**
     * Delete a settings record by ID.
     *
     * @public
     * @async
     * @param {number} settingsId - The ID of the settings to delete.
     * @returns {Promise<void>} - A promise that resolves when the settings are deleted.
     */
    public async deleteSettings(settingsId: number): Promise<void> {
        const { del } = makeRequest<void>(DBClientRoutes.settings.byId(settingsId));
        await del();
    }

    /**
     * Get a user's settings record (if already authored).
     *
     * @public
     * @async
     * @param {number} userId - The ID of the user to retrieve the settings for.
     * @returns {Promise<Settings>} - The settings record.
     */
    public async getSettingsByUserId(userId: number): Promise<Settings> {
        const { get } = makeRequest<Settings>(DBClientRoutes.settings.byUserId(userId));
        return get();
    }

    // Suggestions
    /**
     * Get a suggestions record by ID.
     *
     * @public
     * @async
     * @param {number} suggestionsId - The ID of the suggestions record to retrieve.
     * @returns {Promise<Suggestions>} - The suggestions record.
     */
    public async getSuggestions(suggestionsId: number): Promise<Suggestions> {
        const { get } = makeRequest<Suggestions>(DBClientRoutes.suggestions.byId(suggestionsId));
        return get();
    }

    /**
     * Add a suggestions record or update an existing one (handled by the backend API).
     * @date 8/30/2023 - 10:41:59 AM
     *
     * @public
     * @async
     * @param {Suggestions} suggestions - The suggestions record to add or update.
     * @returns {Promise<Suggestions>} - The suggestions record.
     */
    public async addSuggestionsOrUpdate(suggestions: Partial<Suggestions>): Promise<Suggestions> {
        const { post } = makeRequest<Suggestions>(DBClientRoutes.suggestions.base);
        return post(suggestions);
    }

    /**
     * Delete a suggestions record by ID.
     * @date 8/30/2023 - 10:41:59 AM
     *
     * @public
     * @async
     * @param {number} suggestionsId - The ID of the suggestions record to delete.
     * @returns {Promise<void>} - A promise that resolves when the suggestions record is deleted.
     */
    public async deleteSuggestions(suggestionsId: number): Promise<void> {
        const { del } = makeRequest<void>(DBClientRoutes.suggestions.byId(suggestionsId));
        await del();
    }

    /**
     * Get all suggestions a particular user has received.
     *
     * @public
     * @async
     * @param {number} userId - The ID of the user to retrieve suggestions for.
     * @returns {Promise<Suggestions[]>} - The suggestions records.
     */
    public async getSuggestionsByUserId(userId: number): Promise<Suggestions[]> {
        const { get } = makeRequest<Suggestions[]>(DBClientRoutes.suggestions.byUserId(userId));
        return get();
    }

    /**
     * Get all suggestions made for a particular description.
     *
     * @public
     * @async
     * @param {number} descriptionId - The ID of the description to retrieve suggestions for.
     * @returns {Promise<Suggestions>} - The suggestions records.
     */
    public async getSuggestionsByDescriptionId(descriptionId: number): Promise<Suggestions[]> {
        const { get } = makeRequest<Suggestions[]>(
            DBClientRoutes.suggestions.byDescriptionId(descriptionId)
        );
        return get();
    }

    // Event
    /**
     * Log an event record.
     *
     * @public
     * @async
     * @param {Partial<Event>} event - The event record to add.
     * @returns {Promise<Event>} - The event record.
     */
    public async addEvent(event: Partial<Event>): Promise<Event> {
        const { post } = makeRequest<Event>("/event");
        return post(event);
    }

    // GeneratedDescription
    /**
     * Add or update a generated description record.
     *
     * @public
     * @async
     * @param {Partial<GeneratedDescription>} generatedDescription - The generated description record to add or update.
     * @returns {Promise<GeneratedDescription>} - The generated description record.
     */
    public async addOrUpdateGeneratedDescription(
        generatedDescription: Partial<GeneratedDescription>
    ): Promise<GeneratedDescription> {
        const { post } = makeRequest<GeneratedDescription>("/generated_description");
        return post(generatedDescription);
    }

    /**
     * Get a generated description record by figure ID.
     *
     * @public
     * @async
     * @param {number} figureId - The ID of the figure to retrieve the generated description for.
     * @returns {Promise<GeneratedDescription>} - The generated description record.
     */
    public async getGeneratedDescriptionsByFigureId(
        figureId: number
    ): Promise<GeneratedDescription[]> {
        const { get } = makeRequest<GeneratedDescription[]>(`/generated_description/figure/${figureId}`);
        return get();
    }

    // Generic
    /**
     * A generic get method (for any available resource).
     *
     * @public
     * @async
     * @template T - The type of the resource.
     * @param {string} route - The route to the resource.
     * @returns {Promise<T>} - The resource.
     */
    public async get<T>(route: string): Promise<T> {
        const { get } = makeRequest<T>(route);
        return get();
    }

    /**
     * A generic post method (for any available resource).
     *
     * @public
     * @async
     * @template T - The type of the resource.
     * @param {string} route - The route to the resource.
     * @param {*} body - The body of the request.
     * @returns {Promise<T>} - The resource.
     */
    public async post<T>(route: string, body: any): Promise<T> {
        const { post } = makeRequest<T>(route);
        return post(body);
    }
}

export default DBClient.getInstance();

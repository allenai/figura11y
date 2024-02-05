import { Figure } from "@/lib/db-schema";

/**
 * A singleton class to manage backend API calls (to the Flask server).
 * Use `APIClient.getInstance()` to get the instance.
 *
 * @class APIClient
 * @typedef {APIClient}
 */
class APIClient {
    private static instance: APIClient;
    private readonly ENDPOINTS = {
        GET_FIGURES: "/backendapi/document/getfigures",
        PREPROCESS_FIGURE: "/backendapi/figure/preprocess"
    };

    private readonly METHODS = {
        GET: "GET",
        POST: "POST"
    };

    private constructor() { }

    /**
     * Returns the singleton instance of the APIClient class.
     *
     * @public
     * @static
     * @returns {APIClient}
     */
    public static getInstance(): APIClient {
        if (!APIClient.instance) {
            APIClient.instance = new APIClient();
        }
        return APIClient.instance;
    }

    private async fetchAPI(
        endpoint: string,
        method: string,
        body?: FormData | string | undefined,
        headers?: HeadersInit | undefined
    ): Promise<any> {
        const response = await fetch(endpoint, {
            headers,
            method,
            body
        }).catch((err: Error) => {
            // TODO: Handle errors visibly
            console.error("ERROR: ", err);
        });

        const data = await response?.json() || null;
        return data;
    }

    private makeFormFromFile(
        file: File | null,
        ext: string = "pdf"
    ): FormData | null {
        if (!file) {
            return new FormData();
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append(
            "filename",
            file.name || `file.${ext}`
        );
        return formData;
    }

    /**
     * Get figures from an uploaded PDF.
     *
     * @public
     * @async
     * @param {(File | null)} paper - The PDF file to get figures from (null if no file uploaded).
     * @returns {Promise<any>} - Promise that resolves to the figures.
     */
    public async getFigures(paper: File | null): Promise<any> {
        console.log("Requested figures for PDF."); // TODO: Remove for production
        const formData = this.makeFormFromFile(paper, "pdf");
        if (!formData) {
            return null;
        }

        return this.fetchAPI(
            this.ENDPOINTS.GET_FIGURES,
            this.METHODS.POST,
            formData
        );
    }

    /**
     * Preprocess a (selected) figure.
     *
     * @public
     * @async
     * @param {Partial<Figure>} figure - The figure to preprocess.
     * @returns {Promise<any>} - Promise that resolves to the preprocessed figure information.
     */
    public async preprocessFigure(figure: Partial<Figure>): Promise<any> {
        console.log("Requested preprocessing for figure."); // TODO: Remove for production
        return this.fetchAPI(
            this.ENDPOINTS.PREPROCESS_FIGURE,
            this.METHODS.POST,
            JSON.stringify({ figure }),
            { "Content-Type": "application/json" }
        );
    }
}

export default APIClient.getInstance();

import { useEffect, useState } from "react";

/**
 * Params for useAsyncRequest hook.
 *
 * @export
 * @typedef {UseAsyncRequestParams}
 * @template T
 *
 * @property {T | null} defaultValue - The default value.
 * @property {(data?: T) => Promise<T>} apiCall - The API call.
 * @property {any[]} dependencies - The dependencies to watch for (will re-fetch if any of these change).
 * @property {boolean} [autoFetch=false] - Whether or not to automatically fetch the data.
 */
export type UseAsyncRequestParams<T> = {
    defaultValue: T | null;
    apiCall: (data?: T) => Promise<T>;
    dependencies: any[];
    autoFetch?: boolean;
};

/**
 * Result for useAsyncRequest hook.
 * @date 8/29/2023 - 2:27:40 PM
 *
 * @export
 * @typedef {UseAsyncRequestResult}
 * @template T
 *
 * @property {T | null} data - The data, if fetched.
 * @property {boolean} loading - Whether or not the data is currently fetching.
 * @property {string | null} error - The error, if any.
 * @property {() => void} fetchData - Function to fetch the data on-demand.
 * @property {(data: T | null) => void} setData - Function to set the data directly.
 * @property {(shouldFetch: boolean) => void} setShouldFetch - Function to set whether or not to fetch the data on the dependency updates.
 */
export type UseAsyncRequestResult<T> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    fetchData: () => void;
    setData: (data: T | null) => void;
    setShouldFetch: (shouldFetch: boolean) => void;
};

/**
 * Custom hook to fetch data asynchronously.
 *
 * @export
 * @template T
 * @param {UseAsyncRequestParams<T>} {
 *   defaultValue,
 *   apiCall,
 *   dependencies,
 *   autoFetch = false
 * } - The hook params (see {@link UseAsyncRequestParams} for more details).
 * @returns {UseAsyncRequestResult<T>} - The hook result (see {@link UseAsyncRequestResult} for more details).
 */
export function useAsyncRequest<T>({
    defaultValue,
    apiCall,
    dependencies,
    autoFetch = false
}: UseAsyncRequestParams<T>): UseAsyncRequestResult<T> {
    const [shouldFetch, setShouldFetch] = useState<boolean>(autoFetch);
    const [data, setData] = useState<T | null>(defaultValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiCall(data || undefined);
            setData(response);
        } catch (responseError) {
            setError("An error occurred while fetching the data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (shouldFetch && !data) {
            fetchData();
        }
    }, dependencies);

    return { data, loading, error, fetchData, setData, setShouldFetch };
}

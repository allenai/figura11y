/**
 * Convert blob to a base64 string.
 *
 * @param blob - The blob to convert.
 * @returns {Promise<string>} - A promise that resolves to the base64 string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Pad a base64 string with "=" characters to make it a valid base64 string.
 *
 * @param data - The base64 string to pad.
 * @returns {string} - The padded base64 string.
 */
const ensureBase64Padding = (data: string): string => {
    const padLength = 4 - (data.length % 4);
    return data + ("=".repeat(padLength));
};

/**
 * Convert base64 string to a File.
 *
 * @param base64 - The base64 string to convert.
 * @param filename - The filename of the file.
 * @returns {File} - The file.
 */
export const base64ToPDFFile = (base64: string, filename: string): File => {
    const base64Data = base64.split(",")[1] || base64;
    const byteString = Buffer.from(ensureBase64Padding(base64Data), "base64").toString("binary");
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
        bytes[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    const file = new File([blob], filename, { type: "application/pdf" });

    return file;
};

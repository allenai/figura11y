import { useOs } from "@mantine/hooks";

/**
 * A hook to determine the meta key symbol based on the operating system.
 *
 * @returns {string} - Meta key symbol based on the operating system.
 */
export const useMetaKeySymbol = (): string => {
    const os = useOs();
    const isMac = os === "macos";
    const isWindows = os === "windows";

    let metaKeySymbol: string;
    if (isMac) {
        metaKeySymbol = "⌘";
    } else if (isWindows) {
        metaKeySymbol = "Ctrl";
    } else {
        metaKeySymbol = "[⌘|Ctrl]";
    }

    return metaKeySymbol;
};

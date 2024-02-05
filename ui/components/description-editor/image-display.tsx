import React from "react";
import { Image } from "@mantine/core";

/**
 * ImageDisplay props.
 *
 * @interface ImageDisplayProps
 * @typedef {ImageDisplayProps}
 *
 * @property {string} imagedata - The base64 encoded image data as a string.
 * @property {string} altText - The alt text for the image (likely from the editor).
 */
interface ImageDisplayProps {
    imagedata: string;
    altText: string;
}

/**
 * A component to display an image from base64 encoded data.
 *
 * @param {ImageDisplayProps} props - Props containing the image data and alt text.
 */
const ImageDisplay: React.FC<ImageDisplayProps> = ({
    imagedata,
    altText = ""
}) => {
    return (
        <Image
            src={`data:image/png;base64,${imagedata}`} // Assume PNG for now. TODO: support other types.
            alt={altText}
            fit={"contain"} // TODO: make the display dimensions configurable.
            width={"100%"}
            style={{
                overflow: "scroll"
            }}
        />
    );
};

export default ImageDisplay;

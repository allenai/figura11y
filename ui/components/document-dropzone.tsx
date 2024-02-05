import React from "react";
import { Center, Group, Text } from "@mantine/core";
import { Dropzone, FileWithPath, PDF_MIME_TYPE } from "@mantine/dropzone";
import { IconFileDescription, IconUpload, IconX } from "@tabler/icons-react";

/**
 * DocumentDropzone props.
 *
 * @interface DocumentDropzoneProps
 * @typedef {DocumentDropzoneProps}
 *
 * @property {(files: FileWithPath[]) => void} onDrop - Action to perform when a file is selected.
 * @property {?number} maxSize - The maximum size of the file to accept.
 * @property {?(number | string)} width - The width (normally in %) of the dropzone.
 * @property {?number} minWidth - The minimum width of the dropzone.
 * @property {?number} minHeight - The minimum height of the dropzone.
 * @property {?string} bgColor - The background color of the dropzone.
 */
interface DocumentDropzoneProps {
    onDrop: (files: FileWithPath[]) => void;
    maxSize?: number;
    width?: number | string;
    minWidth?: number;
    minHeight?: number;
    bgColor?: string;
}

/**
 * A component to display a dropzone for a PDF file.
 *
 * @param {DocumentDropzoneProps} props - Props containing the action to perform when a file is selected, plus optional styling parameters.
 */
const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
    onDrop,
    maxSize = 50 * 1024 * 1024,
    width = "60%",
    minWidth = 400,
    minHeight = 400,
    bgColor = "#DDF0FF"
}) => (
        <>
            <Center>
                <Dropzone
                    onDrop={onDrop}
                    onReject={(files) => console.log("Will not upload: ", files)} // TODO: Show error message
                    maxSize={maxSize}
                    accept={PDF_MIME_TYPE}
                    multiple={false}
                    style={{ width, minWidth }}
                    bg={bgColor}
                    radius={"md"}
                >
                    <Group
                        position={"center"}
                        style={{ minHeight, pointerEvents: "none" }}
                    >
                        <Dropzone.Accept>
                            <IconUpload size={"3.2rem"} stroke={1.5}/>
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                            <IconX size={"3.2rem"} stroke={1.5}/>
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                            <IconFileDescription size={"3.2rem"} stroke={1.5}/>
                        </Dropzone.Idle>

                        <div>
                            <Text size={"xl"} inline>
                                {"Drag PDF here or click to select file."}
                            </Text>
                        </div>
                    </Group>
                </Dropzone>
            </Center>
        </>
    );

export default DocumentDropzone;

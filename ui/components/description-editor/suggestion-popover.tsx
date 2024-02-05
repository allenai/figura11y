import React from "react";
import { Popover, Stack, Group, Divider, ActionIcon, Text } from "@mantine/core";
import { IconCircleCheckFilled, IconCircleXFilled } from "@tabler/icons-react";

/**
 * SuggestionPopover props.
 *
 * @interface SuggestionPopoverProps
 * @typedef {SuggestionPopoverProps}
 *
 * @property {boolean} opened - Whether the popover should be shown.
 * @property {() => void} onClose - What to do when the popover is closed.
 * @property {{ top: number; left: number; }} position - The absolute position of the popover.
 * @property {() => void} handleConfirm - What to do when the user clicks the confirm button.
 * @property {() => void} handleX - What to do when the user clicks the X button.
 * @property {number} transitionDuration - The duration of the popover animation.
 * @property {string} bgColor - The background color of the popover.
 */
interface SuggestionPopoverProps {
    opened: boolean;
    onClose: () => void;
    position: {
        top: number;
        left: number;
    };
    handleConfirm: () => void;
    handleX: () => void;
    transitionDuration: number;
    bgColor: string;
}

/**
 * A popover to confirm or reject a suggestion.
 *
 * @param {SuggestionPopoverProps} props - Props containing the popover state, position, and callbacks.
 */
const SuggestionPopover: React.FC<SuggestionPopoverProps> = ({
    opened,
    onClose,
    position,
    handleConfirm,
    handleX,
    transitionDuration = 300,
    bgColor = "#1B4596"
}) => {
    return (
        <Popover
            opened={opened}
            onClose={onClose}
            transitionProps={{ duration: transitionDuration, transition: "pop", timingFunction: "ease" }}
        >
            <Popover.Target>
                <div // Make an empty div at the target position to anchor the popover.
                    style={{
                        position: "absolute",
                        ...position
                    }}
                />
            </Popover.Target>
            <Popover.Dropdown bg={bgColor}>
                <Stack>
                    <Text color={"white"}><b>{"Accept Suggestion?"}</b></Text>
                    <Divider/>
                    <Group>
                        {/* Accept suggestion */}
                        <ActionIcon
                            variant={"filled"}
                            color={"green.6"}
                            onClick={handleConfirm}
                        >
                            <IconCircleCheckFilled/>
                        </ActionIcon>
                        {/* Decline suggestion */}
                        <ActionIcon
                            variant={"filled"}
                            color={"red.6"}
                            onClick={handleX}
                        >
                            <IconCircleXFilled/>
                        </ActionIcon>
                    </Group>
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};

export default SuggestionPopover;

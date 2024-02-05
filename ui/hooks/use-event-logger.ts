import { Editor } from "@tiptap/react";
import { Event } from "@/lib/db-schema";
import { useUserStore, useFigureStore, useDescriptionStore } from "@/hooks/store";
import DBClient from "@/lib/db-client";

interface InitialEvent {
    event_type: string;
    event_data: Object;
    event_time: Date;
}

const useEventLogger = (theEditor: Editor | null, condition: string = "full") => {
    const user = useUserStore((state) => state.user);
    const figure = useFigureStore((state) => state.figure);
    const description = useDescriptionStore((state) => state.description);

    if (!user?.id || !figure?.id || !description?.id || !theEditor) {
        return null;
    }

    const makeEvent = (event: InitialEvent): Omit<Event, "id"> => {
        return {
            ...event,
            user_id: user?.id,
            figure_id: figure?.id,
            description_id: description?.id,
            condition,
            study_session: true
        };
    };

    const logEvent = (eventName: string, eventData: Object = {}) => {
        const event = makeEvent({
            event_type: eventName,
            event_data: eventData,
            event_time: new Date()
        });

        DBClient.addEvent(event);
    };

    theEditor?.off("update");
    theEditor?.on("update", ({ editor, transaction }) => {
        if (transaction.docChanged) {
            let isPaste = false;

            // Check if the transaction was triggered by a paste action
            if (transaction.getMeta("paste")) {
                isPaste = true;
            }

            // Handle Paste action
            if (isPaste) {
                const lastStep: any = transaction.steps[transaction.steps.length - 1];
                if (lastStep?.slice?.content?.size > 0) {
                    const node = lastStep.slice.content.firstChild;
                    const pastedText = node ? node.textContent : "";
                    if (pastedText) {
                        logEvent("paste_action", { text: pastedText });
                    }
                }
            } else {
                // Handle key presses
                transaction.steps.forEach((step: any) => {
                    if (step.from === step.to && step.from !== undefined) {
                        logEvent("key_press", { key: "Input" });
                    } else if (step.from !== step.to && step.slice?.content?.size === 0) {
                        logEvent("key_press", { key: "Backspace or Delete" });
                    } else if (step.from !== step.to && step.slice?.content?.size > 0) {
                        logEvent("key_press", { key: "Input" });
                    }
                });
            }
        }
    });

    return null;
};

export default useEventLogger;

import React, { useEffect } from "react";
import { Container, Center, Button } from "@mantine/core";
import DBClient from "@/lib/db-client";
import { useDocument, useFigureSelector } from "@/hooks";
import { useStore, useUserStore, usePaperStore, useFigureStore } from "@/hooks/store";
import FigureSelector from "@/components/figure-selector";
import AsyncDataView from "@/components/async-data";
import DocumentDropzone from "@/components/document-dropzone";
import DescriptionEditor from "@/components/description-editor";
import { blobToBase64 } from "@/lib/base64";

/**
 * Home page. This is used as the default system (without study-specific flow).
 */
const Home: React.FC = () => {
    const { document, setDocument } = useDocument();
    const user = useStore(useUserStore, (state) => state.user);

    const paper = usePaperStore((state) => state.paper);
    const initializePaper = usePaperStore((state) => state.initialize);

    // Since we use conditional rendering based on figure
    // we need to wrap it in a state-based store to avoid any hydration errors
    const figure = useStore(useFigureStore, (state) => state.figure);
    const initializeFigure = useFigureStore((state) => state.initialize);
    const setFigure = useFigureStore((state) => state.setFigure);

    const {
        figures,
        selectedFigure,
        setSelectedFigure,
        activePage,
        setPage,
        open,
        close,
        opened
    } = useFigureSelector();

    useEffect(() => {
        if (selectedFigure && user && paper) {
            DBClient.addFigureOrUpdate(selectedFigure).then((newFigure) => {
                if (!newFigure.ocr_text || !newFigure.ocr_text.length) {
                    initializeFigure(selectedFigure);
                    close();
                } else {
                    setFigure(newFigure);
                    close();
                }
            });
        }
    }, [selectedFigure]);

    useEffect(() => {
        if (document && user) {
            if (paper?.filename === document.name) {
                return;
            }
            document.arrayBuffer().then((buffer) => {
                const blob = new Blob([buffer], { type: "application/pdf" });
                blobToBase64(blob).then((base64: string) => {
                    initializePaper({
                        filename: document.name,
                        pdf_file: base64,
                        user_id: user.id
                    });
                });
            });
        }
    }, [document, user]);

    return (
        <Container fluid>
            {figure && <DescriptionEditor figure={figure} study_session={false}/>}
            {!figure && <DocumentDropzone onDrop={(files) => setDocument(files[0])}/>}
            <FigureSelector
                figures={figures}
                activePage={activePage}
                setPage={setPage}
                setSelectedFigure={setSelectedFigure}
                opened={opened}
                open={open}
                close={close}
            />
            <AsyncDataView
                data={figures}
                messageLoading={"Processing Document"}
                messageError={"Error Processing Uploaded Document"}
                view={(figuresData) => {
                    if (figuresData.data.length) {
                        return (
                            <Center>
                                <Button
                                    size={"xs"}
                                    bg={"dark"} // TODO: Use theme color.
                                    m={"lg"}
                                    onClick={() => open()}
                                >
                                    {"View Figures"}
                                </Button>
                            </Center>
                        );
                    }
                    return null;
                }}
            />
        </Container>
    );
};

export default Home;

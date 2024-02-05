import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useAsyncRequest, UseAsyncRequestResult } from "@/lib/requests";
import { useUserStore, usePaperStore } from "@/hooks/store";
import { Figure } from "@/lib/db-schema";
import DBClient from "@/lib/db-client";
import APIClient from "@/lib/api-client";
import { base64ToPDFFile } from "@/lib/base64";

/**
 * FigureSelector state.
 *
 * @interface FigureSelectorState
 * @typedef {FigureSelectorState}
 *
 * @property {UseAsyncRequestResult<Partial<Figure>[]>} figures - All figures.
 * @property {(Partial<Figure> | null)} selectedFigure - The currently selected figure.
 * @property {(figure: Partial<Figure> | null) => void} setSelectedFigure - Function to set the selected figure.
 * @property {number} activePage - Active page.
 * @property {(page: number) => void} setPage - Function to set the active page.
 * @property {() => void} open - Function to open modal.
 * @property {() => void} close - Function to close modal.
 * @property {boolean} opened - Whether modal is opened.
 */
interface FigureSelectorState {
    figures: UseAsyncRequestResult<Partial<Figure>[]>;
    selectedFigure: Partial<Figure> | null;
    setSelectedFigure: (figure: Partial<Figure> | null) => void;
    activePage: number;
    setPage: (page: number) => void;
    open: () => void;
    close: () => void;
    opened: boolean;
}

/**
 * A hook to manage the figure selection state.
 *
 * @returns {FigureSelectorState}
 */
export const useFigureSelector = (): FigureSelectorState => {
    const [paperFile, setPaperFile] = useState<File | null>(null);
    const [selectedFigure, setSelectedFigure] = useState<Partial<Figure> | null>(null);
    const [activePage, setPage] = useState<number>(1);

    const [opened, { open, close }] = useDisclosure();
    const user = useUserStore((state) => state.user);
    const paper = usePaperStore((state) => state.paper);
    const initializePaper = usePaperStore((state) => state.initialize);

    const figures = useAsyncRequest<Partial<Figure>[]>({
        defaultValue: [],
        apiCall: async () => {
            if (user && paper) {
                const paperFigures = await DBClient.getFiguresByPaperId(paper.id);
                if (!paperFigures || !paperFigures.length) {
                    const newPaperFigures = await APIClient.getFigures(paperFile);
                    if (!paper.title || !paper.authors) {
                        initializePaper({
                            ...paper,
                            title: newPaperFigures.metadata.title,
                            authors: newPaperFigures.metadata.authors
                        });
                    }
                    const updatedFiguresPromises = newPaperFigures.figures.forEach(
                        (figure: Partial<Figure>) => {
                            return DBClient.addFigureOrUpdate({
                                ...figure,
                                paper_id: paper.id,
                                user_id: user.id
                            });
                        }
                    );
                    const updatedFigures = await Promise.all(updatedFiguresPromises);
                    return updatedFigures;
                }
                return paperFigures;
            }
            return [];
        },
        dependencies: [paperFile],
        autoFetch: true
    });

    // Load data
    useEffect(() => {
        if (paper && paper.pdf_file) {
            const { pdf_file, filename } = paper;
            const pdfFile = base64ToPDFFile(pdf_file, filename);
            setPaperFile(pdfFile);
        }
    }, [paper]);

    useEffect(() => {
        if (paperFile) {
            figures.fetchData();
        }
    }, [paperFile]);

    // Show modal to select from figures
    useEffect(() => {
        if (figures.loading || (figures.data && figures.data.length)) {
            open();
        } else {
            close();
        }
    }, [figures.loading]);

    return { figures, selectedFigure, setSelectedFigure, activePage, setPage, open, close, opened };
};

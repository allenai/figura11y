import React, { useEffect } from "react";
import { Modal, Flex, Table, Title, ActionIcon, Text } from "@mantine/core";
import { useUserStore, usePaperStore } from "@/hooks/store";
import DBClient from "@/lib/db-client";
import { useAsyncRequest } from "@/lib/requests";
import AsyncDataView from "@/components/async-data";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { Paper } from "@/lib/db-schema";

interface PaperFigureModalProps {
    opened: boolean;
    close: () => void;
}

const PaperFigureModal: React.FC<PaperFigureModalProps> = ({ opened, close }) => {
    const user = useUserStore((state) => state.user);

    const setPaper = usePaperStore((state) => state.setPaper);

    const papers = useAsyncRequest<Paper[]>({
        defaultValue: [],
        apiCall: () => {
            if (user) {
                return DBClient.getPapersByUserId(user.id);
            }
            return Promise.resolve([]);
        },
        dependencies: [user],
        autoFetch: false
    });

    useEffect(() => {
        if (opened) {
            papers.fetchData();
        }
    }, [opened]);

    return (
        <Modal
            opened={opened}
            onClose={() => {
                close();
            }}
            size={"xl"}
        >
            <Text
                size={"lg"}
                pb={"xl"}
                align={"center"}
            >
                {`Found ${papers.data?.length || 0} papers for user ${user?.username || ""}.`}
            </Text>
            <Flex direction={"column"} gap={"md"}>
                <Flex direction={"row"} gap={"md"}>
                    <AsyncDataView
                        messageLoading={"Loading papers..."}
                        messageError={"Error loading user papers."}
                        data={papers}
                        view={
                            (papersData) => (
                                <Table>
                                    <thead>
                                        <tr>
                                            <th>{"Title"}</th>
                                            <th>{"Filename"}</th>
                                            <th>{"Date Uploaded"}</th>
                                            <th>{"Actions"}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {papersData.data.map((paper: Paper, i: number) => {
                                            return (
                                                <tr key={i}>
                                                    <td>
                                                        <Title
                                                            order={6}
                                                            style={{
                                                                width: 100,
                                                                whiteSpace: "pre-wrap",
                                                                overflowWrap: "break-word"
                                                            }}
                                                        >
                                                            {paper.title}
                                                        </Title>
                                                    </td>
                                                    <td>
                                                        <Text
                                                            size={"sm"}
                                                            style={{
                                                                width: 80,
                                                                whiteSpace: "pre-wrap",
                                                                overflowWrap: "break-word"
                                                            }}
                                                        >
                                                            {paper.filename}
                                                        </Text>
                                                    </td>
                                                    <td>
                                                        <Text size={"xs"}>
                                                            {"Uploaded: "}
                                                            {
                                                                (new Date(paper.date_uploaded)).toLocaleDateString("en-US", {
                                                                    weekday: "long",
                                                                    year: "numeric",
                                                                    month: "long",
                                                                    day: "numeric",
                                                                    hour: "numeric",
                                                                    minute: "numeric"
                                                                })
                                                            }
                                                        </Text>
                                                    </td>
                                                    <td>
                                                        <ActionIcon
                                                            color={"green.6"}
                                                            onClick={() => {
                                                                setPaper(paper);
                                                                close();
                                                            }}
                                                        >
                                                            <IconCircleCheckFilled
                                                                size={24}
                                                                fill={"green.6"}
                                                            />
                                                        </ActionIcon>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            )
                        }
                    />
                </Flex>
            </Flex>
        </Modal>
    );
};

export default PaperFigureModal;

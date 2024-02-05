"use client";

import React, { useEffect, useState } from "react";
import { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { MantineProvider, AppShell, Header, Footer, Group, Stack, Text, Anchor, Title, ActionIcon, Burger } from "@mantine/core";
import { IconArticle, IconReload, IconUser } from "@tabler/icons-react";
import SettingsPanel from "@/components/settings-panel";
import PaperFigureModal from "@/components/paper-figure-modal";
import { SettingsProvider } from "@/context/settings-context";
import { useAuthenticatedUser } from "@/hooks";
import { useUserStore } from "@/hooks/store";

/**
 * Main application entry point.
 *
 * @param {AppProps} props - The application props, provided by Next.js.
 */
const App = (props: AppProps) => {
    const { Component, pageProps } = props;

    // Router instance.
    const router = useRouter();
    const { pathname } = router;
    const removeQueryParamsAndReload = () => {
        router.replace(pathname).then(() => {
            router.reload();
        });
    };

    // Whether the settings panel is opened.
    const [opened, setOpened] = useState(false);
    const [modalOpened, setModalOpened] = useState(false);

    // Check if the user is authenticated.
    const { user } = useAuthenticatedUser();
    const initializeUser = useUserStore((state) => state.initialize);
    const initializedUser = useUserStore((state) => state.user);

    useEffect(() => {
        if (user.username.length && !initializedUser) {
            initializeUser(user);
        }
    }, [user.username.length, initializedUser, initializeUser]);

    return (
        <>
            <Head>
                <title>{"FigurA11y"}</title>
                <meta name={"viewport"} content={"minimum-scale=1, initial-scale=1, width=device-width"} />
            </Head>
            <PaperFigureModal opened={modalOpened} close={() => setModalOpened(false)}/>
            <SettingsProvider>
                <MantineProvider
                    withGlobalStyles
                    withNormalizeCSS
                    theme={{
                        colorScheme: "light"
                    }}
                >
                    <AppShell
                        padding={"md"}
                        header={
                            <Header
                                height={60}
                                p={"sm"}
                                bg={"#11223D"} // TODO: Use theme color.
                            >
                                <Group position={"apart"} align={"center"}>
                                    <Title order={4} color={"#FFBB00"} align={"left"}>{"FigurA11y"}</Title>
                                    <Group>
                                        <ActionIcon
                                            variant={"outline"}
                                            onClick={() => {
                                                sessionStorage.clear();
                                                removeQueryParamsAndReload();
                                            }}
                                        >
                                            <IconReload color={"#FF0000"} size={24}/>
                                        </ActionIcon>
                                        {
                                            !pathname.startsWith("/study/") &&
                                                <ActionIcon
                                                    variant={"outline"}
                                                    onClick={() => setModalOpened(true)}
                                                >
                                                    <IconArticle color={"#FFBB00"} size={24}/>
                                                </ActionIcon>
                                        }
                                        <Text color={"white"} size={"xs"}>
                                            <IconUser color={"#FFFFFF"} size={16}/>
                                            {user ? user.username : "Not logged in"}
                                        </Text>
                                        <Burger opened={opened} onClick={() => setOpened((isOpened) => !isOpened)} color={"#FFFFFF"}/>
                                    </Group>
                                </Group>
                            </Header>
                        }
                        footer={
                            <Footer
                                height={60}
                                p={"sm"}
                                bg={"#11223D"}
                            >
                                <Stack ta={"center"}>
                                    <Text size={"sm"} c={"white"}>
                                        {"© The "}
                                        <Anchor href={"https://allenai.org"}>
                                            {"Allen Institute for Artificial Intelligence"}
                                        </Anchor>
                                        {" - All Rights Reserved."}
                                        <br/>
                                        <Anchor href={"https://allenai.org/privacy-policy"}>{"Privacy Policy"}</Anchor>
                                        {" | "}
                                        <Anchor href={"https://allenai.org/terms"}>{"Terms of Use"}</Anchor>
                                        {" | "}
                                        <Anchor href={"https://allenai.org/business-code-of-conduct"}>
                                            {"Business Code of Conduct"}
                                        </Anchor>
                                    </Text>
                                </Stack>
                            </Footer>
                        }
                        styles={(theme) => ({
                            main: {
                                backgroundColor: theme.colorScheme === "dark" ? // TODO: Use theme color.
                                    theme.colors.dark[8] :
                                    theme.colors.gray[0]
                            }
                        })}
                    >
                        <SettingsPanel opened={opened} close={() => setOpened(false)}/>
                        <Component {...pageProps}/>
                    </AppShell>
                </MantineProvider>
            </SettingsProvider>
        </>
    );
};

export default App;

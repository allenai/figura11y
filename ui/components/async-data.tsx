import React from "react";
import { Center, Loader, Text } from "@mantine/core";
import { UseAsyncRequestResult } from "@/lib/requests";

/**
 * Simple component to display when data is loading.
 *
 * @param {{ message: string; }} props - The message to show when loading.
 */
const DataLoading: React.FC<{ message: string }> = ({ message }) => (
    <Center p={"xl"}>
        <Loader/>
        <Text pl={"sm"} variant={"gradient"} weight={"bold"}>{message}</Text>
    </Center>
);

/**
 * Simple component to display when there's a data loding error.
 *
 * @param {{ message: string; }} props - The message to show when there's an error.
 */
const DataError: React.FC<{ message: string }> = ({ message }) => (
    <Center p={"xl"}>
        <Text variant={"gradient"} weight={"bold"}>{"Error: "}{message}</Text>
    </Center>
);

/**
 * AsyncDataView props.
 *
 * @interface AsyncDataViewProps
 * @typedef {AsyncDataViewProps}
 *
 * @property {UseAsyncRequestResult<any>} data - The data to display.
 * @property {string} messageLoading - The message to display when loading.
 * @property {string} messageError - The message to display when there's an error.
 * @property {(data: any) => JSX.Element | null} view - The view to display when there's no error.
 */
interface AsyncDataViewProps {
    data: UseAsyncRequestResult<any>,
    messageLoading: string,
    messageError: string,
    view: (data: any) => JSX.Element | null
}

/**
 * A component to display data that is loaded asynchronously.
 * It will display a loading message, an error message, or allow a custom view that is passed the data.
 *
 * @param {AsyncDataViewProps} props - Props containing the data, loading and error messages, and view for data.
 */
const AsyncDataView: React.FC<AsyncDataViewProps> = ({
    data,
    messageLoading,
    messageError,
    view
}) => {
    if (data.loading) {
        return <DataLoading message={messageLoading}/>;
    }
    if (data.error) {
        return <DataError message={messageError}/>;
    }
    if (data.data) {
        return view(data);
    }
    return null;
};

export default AsyncDataView;

import { useEffect, useState } from "react";

/**
 * User type.
 *
 * @typedef {Object} User
 * @property {number} id - The user id.
 * @property {string} username - The user username.
 */
export interface User {
    g_id: string;
    username: string;
}

/**
 * User state and setter.
 *
 * @typedef {Object} UserState
 * @property {User} user - The user.
 * @property {function} setUser - The user setter.
 */
interface UserState {
    user: User;
    setUser: (user: User) => void;
}

/**
 * A hook to manage user state (by default, will be taken from the header).
 *
 * @returns {UserState} - User state and setter.
 */
export const useAuthenticatedUser = (): UserState => {
    const [user, setUser] = useState<User>({ g_id: "0", username: "" });

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/check-auth");
            if (res.status === 200) {
                const data = await res.json();
                setUser(data);
            } else {
                const data = await res.json();
                setUser({ g_id: "0", username: "TEST" });
            }
        };

        fetchData();
    }, []);

    return { user, setUser };
};

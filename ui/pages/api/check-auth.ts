import { NextApiRequest, NextApiResponse } from "next";

/**
 * This API endpoint is used to check if the user is authenticated.
 * If the user is authenticated, the endpoint will return the user's ID and username.
 *
 * @export
 * @async
 * @param {NextApiRequest} req - The request object, assumed to contain the {@link SuggestionRequest} parameters in the body.
 * @param {NextApiResponse<{ result: string, messages?: Message[] }>} res - The response object, with the result and messages (if any).
 * @returns {*}
 */
export default async (
    req: NextApiRequest,
    res: NextApiResponse<{
        g_id?: string;
        username?: string;
        message?: string
    }>
) => {
    // Check for skiff-provided headers
    const userId = req.headers["x-auth-request-user"];
    const userEmail = req.headers["x-auth-request-email"];

    if (userId && userEmail) {
        res.status(200).json({ g_id: userId as string, username: userEmail as string });
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
};

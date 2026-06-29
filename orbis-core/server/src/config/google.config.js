import dotenv from "dotenv";
dotenv.config();

export const config = {
    googleApiKey : process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
    model : process.env.ORBIS_CLI || "gemini-2.5-flash"
}
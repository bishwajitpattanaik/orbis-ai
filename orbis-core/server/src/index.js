// Global Imports
import express from "express";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import conversationRoutes from "./routes/conversations.js";
app.use("/api/conversations", conversationRoutes);
// Local Imports
import { auth } from "./lib/auth.js";

dotenv.config();

const app = express();

// Configure CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth)); 

app.use(express.json());

app.get("/api/me", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	return res.json(session);
});

app.get("/device", async(req, res) => {
  const {user_code} = req.query;
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
})


app.get("/health" , (req, res)=> {
    res.send("OK")
})


app.listen(process.env.PORT , () => {
    console.log(`Your application is running on http://localhost:${process.env.PORT}`)
})

app.use("/api/conversations", conversationRoutes);
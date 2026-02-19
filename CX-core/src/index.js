import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import teacherRoutes from "./routes/teacherRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bodyParser from "body-parser";
import quizRoutes from "./routes/quizRoutes.js";

const app = express();

// app.set("etag", false);
// app.use((req, res, next) => {
//   res.setHeader("Cache-Control", "no-store");
//   next();
// });

dotenv.config();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:5173", // frontend URL
  credentials: true
}));

app.use(express.json());

app.use("/auth", authRoutes);

app.use("/teach", teacherRoutes);

app.use("/events", eventRoutes);

app.use("/quiz", quizRoutes);

app.get("/", (req, res) => res.send("Codexa backend running ✅"));

app.listen(PORT, "::", () => {
  console.log(`Server running on all interfaces at port ${PORT}`);
});
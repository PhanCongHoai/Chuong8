import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import audioRoutes from "./routes/audioRoutes.js";
import audioSqlRoutes from "./routes/audioSqlRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import { ensureStore } from "./services/libraryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 4000;

ensureStore();

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    message: "Dịch vụ cơ sở dữ liệu âm thanh đang hoạt động.",
  });
});

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audios", audioRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/audiosql", audioSqlRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Máy chủ gặp lỗi chưa xác định.",
  });
});

app.listen(port, () => {
  console.log(`Audio database backend đang chạy tại http://localhost:${port}`);
});

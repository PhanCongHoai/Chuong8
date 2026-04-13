import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  getAllAudios,
  getAudioById,
  createAudioRecord,
  deleteAudio,
  reanalyzeAudio,
  getSignalPreview,
} from "../services/libraryService.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

router.get("/", (_req, res) => {
  res.json(getAllAudios());
});

router.get("/:id", (req, res) => {
  const audio = getAudioById(req.params.id);
  if (!audio) {
    return res.status(404).json({ message: "Không tìm thấy bản ghi âm thanh." });
  }

  return res.json(audio);
});

router.get("/:id/preview", (req, res) => {
  const preview = getSignalPreview(req.params.id);
  if (!preview) {
    return res.status(404).json({ message: "Không tìm thấy dữ liệu xem trước tín hiệu." });
  }

  return res.json(preview);
});

router.post("/upload", upload.single("audio"), async (req, res, next) => {
  try {
    const record = await createAudioRecord({
      file: req.file,
      body: req.body,
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/reanalyze", async (req, res, next) => {
  try {
    const record = await reanalyzeAudio(req.params.id);
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const result = deleteAudio(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

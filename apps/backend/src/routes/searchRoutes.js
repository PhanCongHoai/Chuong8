import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  searchSimilarAudios,
  searchSimilarFromUploadedFile,
  searchByKeyword,
} from "../services/libraryService.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads/search-query");

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

router.get("/similar/:id", (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 5);
    res.json(searchSimilarAudios(req.params.id, limit));
  } catch (error) {
    next(error);
  }
});

router.post("/similar-upload", upload.single("audio"), async (req, res, next) => {
  const limit = Number(req.query.limit || 5);

  try {
    const result = await searchSimilarFromUploadedFile(req.file, limit);
    res.json(result);
  } catch (error) {
    next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

router.get("/metadata", (req, res) => {
  const q = `${req.query.q || ""}`.trim();
  res.json(searchByKeyword(q));
});

export default router;

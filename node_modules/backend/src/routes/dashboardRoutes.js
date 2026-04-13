import express from "express";
import { getDashboardSummary } from "../services/libraryService.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(getDashboardSummary());
});

export default router;

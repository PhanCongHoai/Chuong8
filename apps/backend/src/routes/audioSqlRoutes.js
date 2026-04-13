import express from "express";
import { executeAudioSql } from "../services/audioSqlService.js";

const router = express.Router();

router.post("/query", (req, res, next) => {
  try {
    const result = executeAudioSql(req.body.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

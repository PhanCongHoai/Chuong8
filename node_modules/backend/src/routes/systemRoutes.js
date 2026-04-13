import express from "express";
import { getAudioIndexOverview, getMetadataIndexOverview } from "../services/libraryService.js";
import {
  getAudioIndexSchema,
  getAudioSqlExamples,
  getExerciseCoverage,
  getPrimitiveFunctions,
} from "../services/systemDesignService.js";

const router = express.Router();

router.get("/primitives", (_req, res) => {
  res.json(getPrimitiveFunctions());
});

router.get("/coverage", (_req, res) => {
  res.json(getExerciseCoverage());
});

router.get("/index", (_req, res) => {
  res.json(getAudioIndexOverview());
});

router.get("/metadata-index", (_req, res) => {
  res.json(getMetadataIndexOverview());
});

router.get("/schema", (_req, res) => {
  res.json(getAudioIndexSchema());
});

router.get("/audiosql/examples", (_req, res) => {
  res.json(getAudioSqlExamples());
});

export default router;

import express from "express";
import { createCollection, getCollections } from "../services/libraryService.js";

const router = express.Router();

router.get("/", (_req, res) => {
  res.json(getCollections());
});

router.post("/", (req, res, next) => {
  try {
    const collection = createCollection(req.body);
    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
});

export default router;

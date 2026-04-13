import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  analyzeAudioFile,
  buildComparisonFeatureVector,
  FEATURE_VECTOR_DIMENSION,
} from "./signalFeatureService.js";
import { euclideanDistance, euclideanSimilarity } from "./vectorSearchService.js";
import {
  buildMetadataIndex,
  filterByMetadataField,
  searchMetadataIndex,
} from "./metadataIndexService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");
const dbPath = path.join(backendRoot, "data", "db.json");
const featureCsvPath = path.join(backendRoot, "data", "audio-feature-vectors.csv");

const featureVectorHeaders = [
  "meanEnergy",
  "maxEnergy",
  "energyStdDev",
  "meanLoudnessDb",
  "loudnessStdDev",
  "dominantPitchHz",
  "normalizedBrightness",
  "meanZeroCrossingRate",
  "peakAmplitude",
  "energyCrestFactor",
  "highEnergyWindowRatio",
  "durationSeconds",
];

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : 0;
}

function hasCurrentFeatureVector(audio) {
  return Array.isArray(audio?.featureVector) && audio.featureVector.length === FEATURE_VECTOR_DIMENSION;
}

const defaultDb = {
  audios: [],
  collections: [
    {
      id: "collection-001",
      name: "Kho dữ liệu nghiên cứu chương 8",
      purpose: "Mô phỏng audio database dùng cho truy vấn metadata và tìm kiếm tương tự.",
      color: "#0f766e",
      createdAt: new Date().toISOString(),
    },
  ],
};

function readDb() {
  ensureStore();
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  let changed = false;

  db.audios = (db.audios || []).map((audio) => {
    if (hasCurrentFeatureVector(audio) || !audio.windows?.length || !audio.summary) {
      return audio;
    }

    const featureVector = buildComparisonFeatureVector(audio);

    if (featureVector.length !== FEATURE_VECTOR_DIMENSION) {
      return audio;
    }

    changed = true;
    return {
      ...audio,
      featureVector,
    };
  });

  if (changed) {
    writeDb(db);
  }

  return db;
}

function escapeCsvCell(value) {
  const normalized =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join(" | ")
        : `${value}`;

  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildFeatureCsvContent(audios = []) {
  const header = [
    "audioId",
    "title",
    "category",
    "fileName",
    "analysisStatus",
    ...featureVectorHeaders,
  ];

  const rows = audios.map((audio) => {
    const vector = Array.isArray(audio?.featureVector) ? audio.featureVector : [];
    const featureCells = featureVectorHeaders.map((_, index) =>
      escapeCsvCell(vector[index] ?? "")
    );

    return [
      escapeCsvCell(audio?.id || ""),
      escapeCsvCell(audio?.title || ""),
      escapeCsvCell(audio?.category || ""),
      escapeCsvCell(audio?.fileName || ""),
      escapeCsvCell(audio?.analysisStatus || ""),
      ...featureCells,
    ].join(",");
  });

  return `\uFEFF${header.join(",")}\r\n${rows.join("\r\n")}`;
}

function writeFeatureCsv(audios = []) {
  fs.writeFileSync(featureCsvPath, buildFeatureCsvContent(audios), "utf8");
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  writeFeatureCsv(data?.audios || []);
}

function isPathInside(parentPath, targetPath) {
  const normalizedParent = path.resolve(parentPath);
  const normalizedTarget = path.resolve(targetPath);
  return normalizedTarget.startsWith(`${normalizedParent}${path.sep}`) || normalizedTarget === normalizedParent;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((item) => `${item}`.trim()).filter(Boolean);
  }

  return `${tags || ""}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hydrateAudio(audio, collections) {
  const fileToken = audio.filePath ? path.basename(audio.filePath) : "";

  return {
    ...audio,
    collectionName:
      collections.find((collection) => collection.id === audio.collectionId)?.name || "Chưa gắn bộ sưu tập",
    publicFilePath: fileToken ? `/uploads/${encodeURIComponent(fileToken)}` : "",
  };
}

function buildVectorIndex(audios) {
  const items = audios
    .filter((audio) => hasCurrentFeatureVector(audio))
    .map((audio) => ({
      audioId: audio.id,
      title: audio.title,
      dimension: audio.featureVector.length,
      metric: "euclidean",
      vector: audio.featureVector,
    }));

  return {
    dimension: items[0]?.dimension || 0,
    metric: "euclidean",
    itemCount: items.length,
    items,
  };
}

function buildSegmentIndex(audios) {
  return audios
    .filter((audio) => audio.windows?.length)
    .map((audio) => ({
      audioId: audio.id,
      title: audio.title,
      windowCount: audio.windows.length,
      firstWindow: audio.windows[0],
      lastWindow: audio.windows[audio.windows.length - 1],
    }));
}

function buildPreviewEnvelope(windows, durationSeconds) {
  if (!windows?.length) {
    return [];
  }

  const pointCount = clampPreviewPointCount(durationSeconds, windows.length);
  const chunkSize = Math.max(1, Math.ceil(windows.length / pointCount));
  const chunks = [];

  for (let start = 0; start < windows.length; start += chunkSize) {
    const chunk = windows.slice(start, start + chunkSize);

    if (!chunk.length) {
      continue;
    }

    const avgEnergy = chunk.reduce((sum, item) => sum + item.energy, 0) / chunk.length;
    const avgLoudness = chunk.reduce((sum, item) => sum + item.loudness, 0) / chunk.length;
    const avgBrightness = chunk.reduce((sum, item) => sum + item.brightness, 0) / chunk.length;
    const timeSecond = chunk.reduce((sum, item) => sum + item.startSecond, 0) / chunk.length;

    chunks.push({
      timeSecond,
      energy: avgEnergy,
      loudness: avgLoudness,
      brightness: avgBrightness,
    });
  }

  const smoothedLoudness = chunks.map((chunk, index) => {
    const previous = chunks[Math.max(0, index - 1)]?.loudness ?? chunk.loudness;
    const current = chunk.loudness;
    const next = chunks[Math.min(chunks.length - 1, index + 1)]?.loudness ?? chunk.loudness;
    return (previous + current + next) / 3;
  });

  const minLoudness = Math.min(...smoothedLoudness);
  const maxLoudness = Math.max(...smoothedLoudness);
  const dynamicRange = Math.max(8, maxLoudness - minLoudness);

  return chunks.map((chunk, index) => ({
    index,
    timeSecond: round(chunk.timeSecond),
    energy: round(chunk.energy),
    loudness: round(smoothedLoudness[index]),
    brightness: round(chunk.brightness),
    level: round((smoothedLoudness[index] - minLoudness) / dynamicRange),
  }));
}

function clampPreviewPointCount(durationSeconds, windowCount) {
  const desired = Math.round(Math.max(32, Math.min(96, durationSeconds * 10)));
  return Math.min(windowCount, desired);
}

function normalizeProfileVectors(vectors) {
  if (!vectors.length) {
    return [];
  }

  const dimensions = vectors[0].length;
  const mins = Array.from({ length: dimensions }, (_, index) =>
    Math.min(...vectors.map((vector) => vector[index]))
  );
  const maxs = Array.from({ length: dimensions }, (_, index) =>
    Math.max(...vectors.map((vector) => vector[index]))
  );

  return vectors.map((vector) =>
    vector.map((value, index) => {
      const span = maxs[index] - mins[index];
      if (!span) {
        return 0;
      }

      return round((value - mins[index]) / span);
    })
  );
}

function weightComparisonVector(vector) {
  const weights = [1.1, 1.3, 1.2, 0.8, 0.8, 0.6, 1.0, 1.0, 1.2, 1.4, 1.3, 0.5];
  return vector.map((value, index) => round(value * (weights[index] || 1)));
}

export function ensureStore() {
  const dataDir = path.dirname(dbPath);
  const uploadsDir = path.join(backendRoot, "uploads");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    writeDb(defaultDb);
    return;
  }

  if (!fs.existsSync(featureCsvPath)) {
    writeFeatureCsv(JSON.parse(fs.readFileSync(dbPath, "utf8"))?.audios || []);
  }
}

export function replaceDatabase(data) {
  writeDb(data);
}

export function exportFeatureVectorCsv() {
  const db = readDb();
  writeFeatureCsv(db.audios || []);
  return featureCsvPath;
}

export function getDatabase() {
  return readDb();
}

export function getAllAudios() {
  const db = readDb();
  return db.audios
    .map((audio) => hydrateAudio(audio, db.collections))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getAudioById(id) {
  const db = readDb();
  const audio = db.audios.find((item) => item.id === id);

  if (!audio) {
    return null;
  }

  return hydrateAudio(audio, db.collections);
}

export function getSignalPreview(id) {
  const audio = getAudioById(id);

  if (!audio || !audio.windows?.length) {
    return null;
  }

  return {
    id: audio.id,
    title: audio.title,
    durationSeconds: audio.durationSeconds,
    points: buildPreviewEnvelope(audio.windows, audio.durationSeconds),
  };
}

export async function createAudioRecord({ file, body }) {
  const db = readDb();

  const record = {
    id: `audio-${Date.now()}`,
    title: body.title?.trim() || file?.originalname || "Bản ghi chưa đặt tên",
    description: body.description?.trim() || "",
    category: body.category?.trim() || "Chưa phân loại",
    tags: normalizeTags(body.tags),
    collectionId: body.collectionId?.trim() || db.collections[0]?.id || null,
    researcher: body.researcher?.trim() || "Chưa xác định",
    priority: body.priority?.trim() || "Trung bình",
    fileName: file?.originalname || "",
    filePath: file?.path || "",
    mimeType: file?.mimetype || "",
    durationSeconds: 0,
    createdAt: new Date().toISOString(),
    analysisStatus: "Đang chờ phân tích",
    featureVector: [],
    windows: [],
    summary: null,
    notes: body.notes?.trim() || "",
    sourceType: body.sourceType?.trim() || "uploaded",
  };

  if (file?.path) {
    try {
      const analysis = await analyzeAudioFile(file.path);
      // Khi upload audio moi, he thong phan tich ngay va sinh san featureVector 12 chieu.
      // Vector nay duoc luu vao DB cung windows va summary de phuc vu truy van Euclid ve sau.
      // Trong file hien tai: dong 310-312 la cho gan featureVector/windows/summary vao record.
      record.durationSeconds = analysis.durationSeconds;
      record.analysisStatus = "Đã phân tích";
      record.featureVector = analysis.featureVector;
      record.windows = analysis.windows;
      record.summary = analysis.summary;
    } catch (error) {
      record.analysisStatus = `Lỗi phân tích: ${error.message}`;
    }
  }

  // Luc nay record da chua featureVector, windows va summary da tinh toan.
  // db.audios.push + writeDb(db) la buoc luu cac vector/dac trung nay xuong data/db.json.
  // Trong file hien tai: dong 320-321 la cho ghi ban ghi da co vector xuong DB.
  db.audios.push(record);
  writeDb(db);
  return hydrateAudio(record, db.collections);
}

export async function reanalyzeAudio(id) {
  const db = readDb();
  const index = db.audios.findIndex((audio) => audio.id === id);

  if (index === -1) {
    throw new Error("Không tìm thấy bản ghi để phân tích lại.");
  }

  const current = db.audios[index];

  if (!current.filePath) {
    throw new Error("Bản ghi này chưa có tệp âm thanh để phân tích.");
  }

  const analysis = await analyzeAudioFile(current.filePath);
  const updated = {
    ...current,
    // Khi reanalyze, toan bo dac trung duoc tinh lai tu tep goc.
    // featureVector 12 chieu moi se de len gia tri cu trong DB.
    // Trong file hien tai: dong 346-348 la cho gan lai featureVector/windows/summary moi.
    durationSeconds: analysis.durationSeconds,
    analysisStatus: "Đã phân tích lại",
    featureVector: analysis.featureVector,
    windows: analysis.windows,
    summary: analysis.summary,
  };

  // Ghi de ban ghi cu bang ket qua phan tich moi, bao gom featureVector da tinh lai.
  // writeDb(db) la buoc luu cac vector cap nhat xuong data/db.json.
  // Trong file hien tai: dong 353-354 la cho ghi de vector moi vao DB.
  db.audios[index] = updated;
  writeDb(db);
  return hydrateAudio(updated, db.collections);
}

export function deleteAudio(id) {
  const db = readDb();
  const index = db.audios.findIndex((audio) => audio.id === id);

  if (index === -1) {
    throw new Error("Không tìm thấy bản ghi để xóa.");
  }

  const target = db.audios[index];
  const uploadsDir = path.join(backendRoot, "uploads");

  if (target.filePath && fs.existsSync(target.filePath) && isPathInside(uploadsDir, target.filePath)) {
    fs.unlinkSync(target.filePath);
  }

  db.audios.splice(index, 1);
  writeDb(db);

  return {
    id,
    deleted: true,
    title: target.title,
  };
}

function buildSimilarAudioResults(sourceAudio, limit = 5, excludedAudioId = null) {
  const candidates = getAllAudios().filter(
    (audio) => audio.id !== excludedAudioId && hasCurrentFeatureVector(audio)
  );
  const normalizedProfiles = normalizeProfileVectors([
    sourceAudio.featureVector,
    ...candidates.map((audio) => audio.featureVector),
  ]);
  const weightedSourceVector = weightComparisonVector(normalizedProfiles[0]);

  return candidates
    .map((audio, index) => {
      const weightedCandidateVector = weightComparisonVector(
        normalizedProfiles[index + 1]
      );
      const distance = euclideanDistance(
        weightedSourceVector,
        weightedCandidateVector
      );

      return {
        ...audio,
        distance,
        similarity: euclideanSimilarity(distance),
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export function searchSimilarAudios(id, limit = 5) {
  const audios = getAllAudios();
  const source = audios.find((audio) => audio.id === id);

  if (!source) {
    throw new Error("Không tìm thấy âm thanh gốc để so sánh.");
  }

  if (!hasCurrentFeatureVector(source)) {
    return [];
  }

  return buildSimilarAudioResults(source, limit, id);
}

export async function searchSimilarFromUploadedFile(file, limit = 5) {
  if (!file?.path) {
    throw new Error("ChÆ°a cÃ³ tá»‡p Ã¢m thanh Ä‘á»ƒ tÃ¬m kiáº¿m.");
  }

  // Day la file truy van tam thoi do nguoi dung vua tai len.
  // He thong khong dung featureVector co san trong DB, ma phan tich ngay tai luc truy van.
  const analysis = await analyzeAudioFile(file.path);

  return {
    query: {
      fileName: file.originalname || path.basename(file.path),
      mimeType: file.mimetype || "",
      durationSeconds: analysis.durationSeconds,
      // summary mo ta ket qua phan tich tong quan cua file truy van.
      summary: analysis.summary,
      // featureVector 12 chieu duoc sinh moi tu windows + summary cua chinh file nay.
      featureVector: analysis.featureVector,
    },
    results: analysis.featureVector?.length === FEATURE_VECTOR_DIMENSION
      // Sau khi co vector cua file truy van, he thong moi dem di so sanh voi cac audio trong thu vien.
      ? buildSimilarAudioResults(analysis, limit)
      : [],
  };
}

export function searchByKeyword(keyword) {
  const db = readDb();
  const audios = db.audios.map((audio) => hydrateAudio(audio, db.collections));
  const metadataIndex = buildMetadataIndex(audios, db.collections);
  return searchMetadataIndex(metadataIndex, audios, keyword);
}

export function filterAudiosByField(field, value) {
  return filterByMetadataField(getAllAudios(), field, value);
}

export function getCollections() {
  const db = readDb();
  return db.collections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function createCollection(payload) {
  const db = readDb();

  const collection = {
    id: `collection-${Date.now()}`,
    name: payload.name?.trim() || "Bộ sưu tập mới",
    purpose: payload.purpose?.trim() || "",
    color: payload.color?.trim() || "#2563eb",
    createdAt: new Date().toISOString(),
  };

  db.collections.push(collection);
  writeDb(db);
  return collection;
}

export function getMetadataIndexOverview() {
  const db = readDb();
  const audios = db.audios.map((audio) => hydrateAudio(audio, db.collections));
  const metadataIndex = buildMetadataIndex(audios, db.collections);

  return {
    stats: metadataIndex.stats,
    sampleTokens: Object.entries(metadataIndex.tokenIndex)
      .slice(0, 12)
      .map(([token, ids]) => ({
        token,
        ids,
      })),
    sampleTags: Object.entries(metadataIndex.tagIndex)
      .slice(0, 12)
      .map(([tag, ids]) => ({
        tag,
        ids,
      })),
  };
}

export function getAudioIndexOverview() {
  const db = readDb();
  const audios = db.audios.map((audio) => hydrateAudio(audio, db.collections));
  const metadataIndex = buildMetadataIndex(audios, db.collections);

  return {
    vectorIndex: buildVectorIndex(audios),
    metadataIndex: {
      stats: metadataIndex.stats,
      sampleTokens: Object.entries(metadataIndex.tokenIndex).slice(0, 8),
    },
    segmentIndex: buildSegmentIndex(audios),
  };
}

export function getDashboardSummary() {
  const db = readDb();
  const audios = db.audios.map((audio) => hydrateAudio(audio, db.collections));
  const analyzed = audios.filter((item) => hasCurrentFeatureVector(item));
  const totalWindows = analyzed.reduce((sum, audio) => sum + (audio.windows?.length || 0), 0);
  const metadataOverview = getMetadataIndexOverview();

  const categoryMap = audios.reduce((acc, audio) => {
    const key = audio.category || "Chưa phân loại";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categoryStats = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    count,
  }));

  return {
    stats: [
      {
        label: "Tổng số bản ghi",
        value: audios.length,
        note: "Bao gồm bản ghi tải lên và dữ liệu seed.",
      },
      {
        label: "Bản ghi đã phân tích",
        value: analyzed.length,
        note: "Đã có vector đặc trưng phục vụ truy vấn tương tự.",
      },
      {
        label: "Số cửa sổ tín hiệu",
        value: totalWindows,
        note: "Được tạo ở bước segmentation theo Chương 8.",
      },
      {
        label: "Token metadata",
        value: metadataOverview.stats.tokenCount,
        note: "Số lượng token trong inverted index metadata.",
      },
    ],
    categoryStats,
    recentAudios: audios.slice(0, 5),
  };
}

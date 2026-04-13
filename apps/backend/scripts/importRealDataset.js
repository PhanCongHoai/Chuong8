import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAudioFile } from "../src/services/signalFeatureService.js";
import { ensureStore, replaceDatabase } from "../src/services/libraryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..", "..");
const backendRoot = path.resolve(__dirname, "..");
const datasetRoot = path.join(projectRoot, "dataset", "real-audio");
const uploadsDir = path.join(backendRoot, "uploads");

const categoryMap = {
  clap: {
    titlePrefix: "Tiếng vỗ tay",
    category: "Sự kiện âm thanh",
    tags: ["vỗ tay", "khán giả", "dữ liệu thật"],
    priority: "Cao",
    description:
      "Âm thanh vỗ tay thật dùng để kiểm thử bài toán indexing và similarity retrieval.",
  },
  drum: {
    titlePrefix: "Tiếng trống",
    category: "Nhạc cụ gõ",
    tags: ["trống", "nhạc cụ", "dữ liệu thật"],
    priority: "Cao",
    description:
      "Âm thanh trống thật dùng để so sánh với các sự kiện âm thanh khác trong chỉ mục.",
  },
  bell: {
    titlePrefix: "Tiếng chuông",
    category: "Âm báo",
    tags: ["chuông", "ting", "dữ liệu thật"],
    priority: "Cao",
    description:
      "Âm thanh chuông thật dùng để minh họa truy vấn theo nội dung và metadata.",
  },
};

function ensureDatasetExists() {
  if (!fs.existsSync(datasetRoot)) {
    throw new Error("Không tìm thấy thư mục dataset/real-audio.");
  }
}

function normalizeFileName(fileName) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase();
}

function toDisplayTitle(baseName) {
  return baseName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function importDataset() {
  ensureStore();
  ensureDatasetExists();
  fs.mkdirSync(uploadsDir, { recursive: true });

  const collection = {
    id: "collection-001",
    name: "Bộ dữ liệu âm thanh thật",
    purpose: "Dữ liệu thật do người dùng cung cấp cho bài toán vỗ tay, trống, chuông.",
    color: "#0f766e",
    createdAt: new Date().toISOString(),
  };

  const folders = Object.keys(categoryMap);
  const audios = [];
  let counter = 1;

  for (const folderName of folders) {
    const folderPath = path.join(datasetRoot, folderName);
    const files = fs.existsSync(folderPath)
      ? fs.readdirSync(folderPath).filter((file) => /\.(mp3|wav)$/i.test(file))
      : [];

    for (const fileName of files) {
      const sourcePath = path.join(folderPath, fileName);
      const uploadName = `${Date.now()}-${counter}-${normalizeFileName(fileName)}`;
      const targetPath = path.join(uploadsDir, uploadName);
      fs.copyFileSync(sourcePath, targetPath);

      const analysis = await analyzeAudioFile(targetPath);
      const template = categoryMap[folderName];

      audios.push({
        id: `audio-${String(counter).padStart(3, "0")}`,
        title: `${template.titlePrefix}: ${toDisplayTitle(fileName)}`,
        description: template.description,
        category: template.category,
        tags: template.tags,
        collectionId: collection.id,
        researcher: "Người dùng cung cấp dữ liệu",
        priority: template.priority,
        fileName,
        filePath: targetPath,
        mimeType: path.extname(fileName).toLowerCase() === ".mp3" ? "audio/mpeg" : "audio/wav",
        durationSeconds: analysis.durationSeconds,
        createdAt: new Date().toISOString(),
        analysisStatus: "Đã phân tích",
        featureVector: analysis.featureVector,
        windows: analysis.windows,
        summary: analysis.summary,
        notes: `Import từ thư mục dữ liệu thật: ${folderName}`,
        sourceType: "real-dataset",
      });

      counter += 1;
    }
  }

  replaceDatabase({
    audios,
    collections: [collection],
  });

  console.log(`Đã import ${audios.length} file âm thanh thật vào hệ thống.`);
}

await importDataset();

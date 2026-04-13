import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeAudioFile } from "../src/services/signalFeatureService.js";
import { replaceDatabase, ensureStore } from "../src/services/libraryService.js";

const sampleRate = 16000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function createEnvelope(length) {
  const attack = Math.max(1, Math.floor(length * 0.08));
  const release = Math.max(1, Math.floor(length * 0.16));
  const sustainStart = attack;
  const sustainEnd = Math.max(sustainStart, length - release);

  return Array.from({ length }, (_, index) => {
    if (index < attack) {
      return index / attack;
    }

    if (index > sustainEnd) {
      return Math.max(0, (length - index) / release);
    }

    return 1;
  });
}

function createNoise(length, amplitude = 0.5) {
  return Array.from({ length }, () => (Math.random() * 2 - 1) * amplitude);
}

function createSine(length, frequency, amplitude = 0.5, phase = 0) {
  return Array.from({ length }, (_, index) => {
    const time = index / sampleRate;
    return Math.sin(2 * Math.PI * frequency * time + phase) * amplitude;
  });
}

function mixSignals(...signals) {
  const size = Math.max(...signals.map((signal) => signal.length));
  return Array.from({ length: size }, (_, index) =>
    clamp(signals.reduce((sum, signal) => sum + (signal[index] || 0), 0))
  );
}

function concatSignals(...signals) {
  return signals.flat();
}

function withEnvelope(signal, envelope) {
  return signal.map((sample, index) => sample * (envelope[index] || 0));
}

function silence(seconds) {
  return Array.from({ length: Math.floor(sampleRate * seconds) }, () => 0);
}

function createBurstLaugh(baseFrequency, burstCount) {
  const bursts = [];

  for (let i = 0; i < burstCount; i += 1) {
    const duration = 0.18 + i * 0.01;
    const length = Math.floor(sampleRate * duration);
    const envelope = createEnvelope(length);
    const tone = mixSignals(
      createSine(length, baseFrequency + i * 6, 0.42),
      createSine(length, baseFrequency * 2.1, 0.18),
      createNoise(length, 0.08)
    );

    bursts.push(withEnvelope(tone, envelope));
    bursts.push(silence(0.07));
  }

  return concatSignals(...bursts);
}

function createClapPattern() {
  const pattern = [];

  for (let i = 0; i < 4; i += 1) {
    const length = Math.floor(sampleRate * 0.09);
    const noise = createNoise(length, 0.95);
    const envelope = createEnvelope(length);
    pattern.push(withEnvelope(noise, envelope));
    pattern.push(silence(0.18));
  }

  return concatSignals(...pattern);
}

function createAlarmSweep() {
  const length = Math.floor(sampleRate * 2.4);
  return Array.from({ length }, (_, index) => {
    const time = index / sampleRate;
    const frequency = 620 + Math.sin(time * 3.2) * 180;
    return clamp(
      Math.sin(2 * Math.PI * frequency * time) * 0.48 +
        Math.sin(2 * Math.PI * frequency * 2 * time) * 0.14
    );
  });
}

function createAmbientHum() {
  const length = Math.floor(sampleRate * 3);
  return mixSignals(
    createSine(length, 70, 0.28),
    createSine(length, 140, 0.08),
    createNoise(length, 0.05)
  );
}

function createPianoMotif() {
  const notes = [261.63, 329.63, 392.0, 523.25];
  const segments = notes.map((frequency) => {
    const length = Math.floor(sampleRate * 0.45);
    const base = mixSignals(
      createSine(length, frequency, 0.35),
      createSine(length, frequency * 2, 0.1),
      createSine(length, frequency * 3, 0.05)
    );
    return withEnvelope(base, createEnvelope(length));
  });

  return concatSignals(...segments);
}

function createVoiceLikeSignal(baseFrequency) {
  const length = Math.floor(sampleRate * 2.6);
  return Array.from({ length }, (_, index) => {
    const time = index / sampleRate;
    const vibrato = Math.sin(time * 6.5) * 8;
    const formant = Math.sin(2 * Math.PI * (baseFrequency + vibrato) * time) * 0.4;
    const harmonic = Math.sin(2 * Math.PI * (baseFrequency * 2.3) * time) * 0.12;
    const modulation = 0.45 + 0.35 * Math.max(0, Math.sin(time * 7.5));
    return clamp((formant + harmonic) * modulation + (Math.random() * 2 - 1) * 0.015);
  });
}

function floatTo16BitPCM(sample) {
  const clamped = clamp(sample);
  return clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
}

function writeWavFile(filePath, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  samples.forEach((sample, index) => {
    buffer.writeInt16LE(floatTo16BitPCM(sample), 44 + index * 2);
  });

  fs.writeFileSync(filePath, buffer);
}

function createSeedDefinitions() {
  return [
    {
      id: "audio-001",
      title: "Tiếng cười nam mô phỏng",
      description: "Mẫu âm thanh mô phỏng chuỗi tiếng cười nam trầm để demo truy vấn tương tự.",
      category: "Biểu cảm con người",
      tags: ["cười", "nam", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Cao",
      sourceType: "synthetic-seed",
      fileName: "seed-male-laughter.wav",
      buildSignal: () => createBurstLaugh(145, 5),
    },
    {
      id: "audio-002",
      title: "Tiếng cười nữ mô phỏng",
      description: "Mẫu âm thanh mô phỏng chuỗi tiếng cười nữ có cao độ cao hơn.",
      category: "Biểu cảm con người",
      tags: ["cười", "nữ", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Cao",
      sourceType: "synthetic-seed",
      fileName: "seed-female-laughter.wav",
      buildSignal: () => createBurstLaugh(228, 5),
    },
    {
      id: "audio-003",
      title: "Tiếng vỗ tay mô phỏng",
      description: "Chuỗi tiếng vỗ tay ngắn dùng để kiểm tra phân biệt âm thanh xung.",
      category: "Sự kiện âm thanh",
      tags: ["vo tay", "su kien", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Trung bình",
      sourceType: "synthetic-seed",
      fileName: "seed-clap.wav",
      buildSignal: () => createClapPattern(),
    },
    {
      id: "audio-004",
      title: "Âm báo động mô phỏng",
      description: "Tín hiệu sweep tuần hoàn mô phỏng chuông cảnh báo điện tử.",
      category: "Thiết bị cảnh báo",
      tags: ["bao dong", "alarm", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Trung bình",
      sourceType: "synthetic-seed",
      fileName: "seed-alarm.wav",
      buildSignal: () => createAlarmSweep(),
    },
    {
      id: "audio-005",
      title: "Âm nền hum mô phỏng",
      description: "Nền âm tần số thấp mô phỏng tiếng máy hoạt động liên tục.",
      category: "Môi trường",
      tags: ["hum", "nen", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Thấp",
      sourceType: "synthetic-seed",
      fileName: "seed-ambient-hum.wav",
      buildSignal: () => createAmbientHum(),
    },
    {
      id: "audio-006",
      title: "Motif piano mô phỏng",
      description: "Motif bốn nốt dùng để minh họa truy vấn mẫu âm nhạc ngắn.",
      category: "Âm nhạc",
      tags: ["piano", "motif", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Trung bình",
      sourceType: "synthetic-seed",
      fileName: "seed-piano-motif.wav",
      buildSignal: () => createPianoMotif(),
    },
    {
      id: "audio-007",
      title: "Giọng nam mô phỏng",
      description: "Tín hiệu voice-like có cao độ thấp, dùng cho nhận dạng tương tự cơ bản.",
      category: "Giọng nói",
      tags: ["giong noi", "nam", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Cao",
      sourceType: "synthetic-seed",
      fileName: "seed-male-voice.wav",
      buildSignal: () => createVoiceLikeSignal(118),
    },
    {
      id: "audio-008",
      title: "Giọng nữ mô phỏng",
      description: "Tín hiệu voice-like có cao độ cao hơn để so sánh với giọng nam mô phỏng.",
      category: "Giọng nói",
      tags: ["giong noi", "nu", "mô phỏng"],
      researcher: "Nhóm đồ án",
      priority: "Cao",
      sourceType: "synthetic-seed",
      fileName: "seed-female-voice.wav",
      buildSignal: () => createVoiceLikeSignal(214),
    },
  ];
}

async function createSeedDatabase() {
  ensureStore();
  fs.mkdirSync(uploadsDir, { recursive: true });

  const collection = {
    id: "collection-001",
    name: "Kho dữ liệu nghiên cứu chương 8",
    purpose: "Bộ dữ liệu seed dùng cho primitive functions, AudioIndex và AudioSQL.",
    color: "#0f766e",
    createdAt: new Date().toISOString(),
  };

  const audios = [];

  for (const seed of createSeedDefinitions()) {
    const filePath = path.join(uploadsDir, seed.fileName);
    writeWavFile(filePath, seed.buildSignal());

    const analysis = await analyzeAudioFile(filePath);

    audios.push({
      id: seed.id,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      tags: seed.tags,
      collectionId: collection.id,
      researcher: seed.researcher,
      priority: seed.priority,
      fileName: seed.fileName,
      filePath,
      mimeType: "audio/wav",
      durationSeconds: analysis.durationSeconds,
      createdAt: new Date().toISOString(),
      analysisStatus: "Đã phân tích",
      featureVector: analysis.featureVector,
      windows: analysis.windows,
      summary: analysis.summary,
      notes: "Dữ liệu seed tổng hợp bằng script để minh họa đồ án chương 8.",
      sourceType: seed.sourceType,
    });
  }

  replaceDatabase({
    audios,
    collections: [collection],
  });
}

await createSeedDatabase();
console.log("Đã tạo dữ liệu seed WAV cho audio database.");

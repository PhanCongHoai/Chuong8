import fs from "node:fs";

function readAscii(buffer, start, length) {
  return buffer.toString("ascii", start, start + length);
}

export function parseWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE") {
    throw new Error("Định dạng không phải WAV hợp lệ.");
  }

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataStart = 0;
  let dataSize = 0;
  let audioFormat = 0;

  while (offset < buffer.length) {
    const chunkId = readAscii(buffer, offset, 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    // Đọc metadata định dạng WAV để biết sample rate, số kênh và bit depth.
    if (chunkId === "fmt ") {
      audioFormat = buffer.readUInt16LE(chunkStart);
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    }

    if (chunkId === "data") {
      dataStart = chunkStart;
      dataSize = chunkSize;
      break;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (audioFormat !== 1) {
    throw new Error("Bản demo chỉ hỗ trợ WAV PCM không nén.");
  }

  if (!dataStart || !sampleRate) {
    throw new Error("Không tìm thấy phần dữ liệu âm thanh trong tệp WAV.");
  }

  const bytesPerSample = bitsPerSample / 8;
  const frameSize = bytesPerSample * channels;
  const totalFrames = Math.floor(dataSize / frameSize);
  const samples = [];

  // Nếu tệp có nhiều kênh, hệ thống trộn về mono để lập chỉ mục đơn giản hơn.
  for (let frame = 0; frame < totalFrames; frame += 1) {
    const base = dataStart + frame * frameSize;
    let mixed = 0;

    for (let channel = 0; channel < channels; channel += 1) {
      const sampleOffset = base + channel * bytesPerSample;
      const raw = buffer.readInt16LE(sampleOffset);
      mixed += raw / 32768;
    }

    samples.push(mixed / channels);
  }

  return {
    sampleRate,
    channels,
    bitsPerSample,
    samples,
    durationSeconds: totalFrames / sampleRate,
  };
}

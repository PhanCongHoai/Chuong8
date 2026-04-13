import fs from "node:fs";
import path from "node:path";
import decode from "audio-decode";
import { parseFile as parseAudioMetadata } from "music-metadata";
import { parseWavFile } from "../utils/wavParser.js";

const EPSILON = 1e-12;
export const FEATURE_VECTOR_DIMENSION = 12;

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(6)) : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mixToMono(channelData) {
  if (!channelData?.length) {
    return [];
  }

  const frameCount = channelData[0].length;
  const samples = new Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let mixed = 0;
    for (let channel = 0; channel < channelData.length; channel += 1) {
      mixed += channelData[channel][frame] || 0;
    }
    samples[frame] = mixed / channelData.length;
  }

  return samples;
}

async function decodeCompressedAudio(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const decoded = await decode(fileBuffer);
  const metadata = await parseAudioMetadata(filePath);

  return {
    samples: mixToMono(decoded.channelData),
    sampleRate: decoded.sampleRate,
    channels: decoded.channelData.length,
    bitsPerSample: metadata.format.bitsPerSample || 32,
    durationSeconds:
      metadata.format.duration ||
      decoded.channelData[0]?.length / Math.max(1, decoded.sampleRate),
    formatName: metadata.format.container || path.extname(filePath).slice(1).toUpperCase(),
  };
}

async function decodeAudioSource(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".wav") {
    return {
      ...parseWavFile(filePath),
      formatName: "WAV",
    };
  }

  if (extension === ".mp3") {
    return decodeCompressedAudio(filePath);
  }

  throw new Error("He thong chi ho tro phan tich WAV va MP3.");
}

function computeRms(samples) {
  if (!samples.length) {
    return 0;
  }

  let sum = 0;
  for (const sample of samples) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / samples.length);
}

function computeZeroCrossingRate(samples) {
  if (samples.length < 2) {
    return 0;
  }

  let crossings = 0;

  for (let index = 1; index < samples.length; index += 1) {
    if (
      (samples[index - 1] >= 0 && samples[index] < 0) ||
      (samples[index - 1] < 0 && samples[index] >= 0)
    ) {
      crossings += 1;
    }
  }

  return crossings / (samples.length - 1);
}

function createHannWindow(size) {
  const window = new Array(size);

  for (let index = 0; index < size; index += 1) {
    window[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1 || 1));
  }

  return window;
}

function applyWindow(samples, window) {
  return samples.map((sample, index) => sample * window[index]);
}

function removeDcOffset(samples) {
  if (!samples.length) {
    return [];
  }

  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  return samples.map((sample) => sample - mean);
}

function downsampleForSpectrum(samples, targetSize = 512) {
  if (samples.length <= targetSize) {
    return samples;
  }

  const step = samples.length / targetSize;
  const reduced = new Array(targetSize);

  for (let index = 0; index < targetSize; index += 1) {
    const start = Math.floor(index * step);
    const end = Math.min(samples.length, Math.floor((index + 1) * step));
    let sum = 0;
    let count = 0;

    for (let pointer = start; pointer < end; pointer += 1) {
      sum += samples[pointer];
      count += 1;
    }

    reduced[index] = count ? sum / count : 0;
  }

  return reduced;
}

function estimatePitch(samples, sampleRate, minHz = 60, maxHz = 1200) {
  if (samples.length < 32) {
    return 0;
  }

  const centered = removeDcOffset(samples);
  const rms = computeRms(centered);

  if (rms < 0.002) {
    return 0;
  }

  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(centered.length - 1, Math.floor(sampleRate / minHz));
  let bestLag = 0;
  let bestScore = 0;
  let zeroLagEnergy = 0;

  for (const sample of centered) {
    zeroLagEnergy += sample * sample;
  }

  if (!zeroLagEnergy) {
    return 0;
  }

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;

    for (let index = 0; index + lag < centered.length; index += 1) {
      correlation += centered[index] * centered[index + lag];
    }

    const normalizedScore = correlation / zeroLagEnergy;

    if (normalizedScore > bestScore) {
      bestScore = normalizedScore;
      bestLag = lag;
    }
  }

  if (!bestLag || bestScore < 0.2) {
    return 0;
  }

  return sampleRate / bestLag;
}

function computeSpectralCentroid(samples, sampleRate) {
  const reducedSamples = downsampleForSpectrum(samples, 512);
  const sampleCount = reducedSamples.length;

  if (sampleCount < 8) {
    return 0;
  }

  const binCount = Math.min(64, Math.floor(sampleCount / 2));
  let weightedFrequency = 0;
  let magnitudeSum = 0;

  for (let bin = 1; bin <= binCount; bin += 1) {
    let real = 0;
    let imaginary = 0;

    for (let index = 0; index < sampleCount; index += 1) {
      const angle = (2 * Math.PI * bin * index) / sampleCount;
      real += reducedSamples[index] * Math.cos(angle);
      imaginary -= reducedSamples[index] * Math.sin(angle);
    }

    const magnitude = Math.sqrt(real * real + imaginary * imaginary);
    const frequency = (bin * sampleRate) / sampleCount;

    weightedFrequency += magnitude * frequency;
    magnitudeSum += magnitude;
  }

  if (!magnitudeSum) {
    return 0;
  }

  return weightedFrequency / magnitudeSum;
}

function computeWindowFeatures(samples, sampleRate, analysisWindow) {
  const windowedSamples = applyWindow(samples, analysisWindow);
  const rms = computeRms(windowedSamples);
  const intensity = rms * rms;
  const loudness = 20 * Math.log10(rms + EPSILON);
  const pitch = estimatePitch(windowedSamples, sampleRate);
  const brightness = computeSpectralCentroid(windowedSamples, sampleRate);
  const zeroCrossingRate = computeZeroCrossingRate(samples);
  const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);

  return {
    energy: round(intensity),
    loudness: round(loudness),
    pitch: round(pitch),
    brightness: round(brightness),
    zeroCrossingRate: round(zeroCrossingRate),
    peak: round(peak),
  };
}

function averageValues(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values, mean = averageValues(values)) {
  if (!values.length) {
    return 0;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) /
    values.length;

  return Math.sqrt(variance);
}

export function buildComparisonFeatureVector(source) {
  const windows = source.windows || [];

  if (!windows.length) {
    return [];
  }

  const energies = windows.map((item) => item.energy || 0);
  const loudnesses = windows.map((item) => item.loudness || 0);
  const zeroCrossingRates = windows.map((item) => item.zeroCrossingRate || 0);
  const peaks = windows.map((item) => item.peak || 0);
  const meanEnergy = averageValues(energies);
  const maxEnergy = energies.length ? Math.max(...energies) : 0;
  const meanLoudness = averageValues(loudnesses);

  return [
    round(meanEnergy),
    round(maxEnergy),
    round(standardDeviation(energies, meanEnergy)),
    round(meanLoudness),
    round(standardDeviation(loudnesses, meanLoudness)),
    round(source.summary?.dominantPitchHz || 0),
    round(source.summary?.normalizedBrightness || 0),
    round(averageValues(zeroCrossingRates)),
    round(peaks.length ? Math.max(...peaks) : 0),
    round(maxEnergy / Math.max(1e-6, meanEnergy || 0)),
    round(energies.filter((value) => value > meanEnergy * 1.25).length / Math.max(1, energies.length)),
    round(source.durationSeconds || 0),
  ];
}

export async function analyzeAudioFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("Tep am thanh khong ton tai.");
  }

  const { samples, sampleRate, bitsPerSample, channels, durationSeconds, formatName } =
    await decodeAudioSource(filePath);

  if (!samples.length) {
    throw new Error("Khong doc duoc mau tin hieu tu tep am thanh.");
  }

  const windowSize = Math.max(1024, Math.floor(sampleRate * 0.05));
  const hopSize = Math.max(512, Math.floor(windowSize / 2));
  const analysisWindow = createHannWindow(windowSize);
  const windows = [];

  for (let start = 0; start + windowSize <= samples.length; start += hopSize) {
    const segment = samples.slice(start, start + windowSize);
    const features = computeWindowFeatures(segment, sampleRate, analysisWindow);

    windows.push({
      startSecond: round(start / sampleRate),
      endSecond: round((start + windowSize) / sampleRate),
      ...features,
    });
  }

  const roundedDurationSeconds = round(durationSeconds);
  const durationLabel =
    durationSeconds >= 60
      ? `${Math.floor(durationSeconds / 60)} phut ${Math.round(durationSeconds % 60)} giay`
      : `${roundedDurationSeconds} giay`;

  const nonZeroPitchWindows = windows.filter((window) => window.pitch > 0);
  const dominantPitchHz = nonZeroPitchWindows.length
    ? nonZeroPitchWindows.reduce((sum, window) => sum + window.pitch, 0) / nonZeroPitchWindows.length
    : 0;

  const summary = {
    sampleRate,
    channels,
    bitsPerSample,
    totalSamples: samples.length,
    durationLabel,
    formatName,
    dominantPitchHz: round(dominantPitchHz),
    averageLoudnessDb: round(
      windows.reduce((sum, item) => sum + item.loudness, 0) / Math.max(1, windows.length)
    ),
    normalizedBrightness: round(
      clamp(
        windows.reduce((sum, item) => sum + item.brightness, 0) /
          Math.max(1, windows.length) /
          Math.max(1, sampleRate / 2),
        0,
        1
      )
    ),
  };

  return {
    durationSeconds: roundedDurationSeconds,
    windows,
    featureVector: buildComparisonFeatureVector({
      durationSeconds: roundedDurationSeconds,
      windows,
      summary,
    }),
    summary,
  };
}

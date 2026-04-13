export function euclideanDistance(a, b) {
  const size = Math.min(a.length, b.length);

  if (!size) {
    return Number.POSITIVE_INFINITY;
  }

  let squaredDistance = 0;

  for (let index = 0; index < size; index += 1) {
    const difference = a[index] - b[index];
    squaredDistance += difference * difference;
  }

  return Number(Math.sqrt(squaredDistance).toFixed(6));
}

export function euclideanSimilarity(distance) {
  if (!Number.isFinite(distance)) {
    return 0;
  }

  // Quy đổi khoảng cách về thang 0..1 để frontend tiếp tục hiển thị phần trăm dễ hiểu.
  return Number((1 / (1 + distance)).toFixed(6));
}

export function cosineSimilarity(a, b) {
  const size = Math.min(a.length, b.length);

  if (!size) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < size; index += 1) {
    dot += a[index] * b[index];
    magA += a[index] * a[index];
    magB += b[index] * b[index];
  }

  if (!magA || !magB) {
    return 0;
  }

  return Number((dot / (Math.sqrt(magA) * Math.sqrt(magB))).toFixed(6));
}

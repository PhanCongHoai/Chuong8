const API_BASE = "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể hoàn thành yêu cầu.");
  }

  return data;
}

export const api = {
  getDashboard: () => request("/dashboard"),
  getAudios: () => request("/audios"),
  getAudio: (id) => request(`/audios/${id}`),
  getPreview: (id) => request(`/audios/${id}/preview`),
  getPrimitiveFunctions: () => request("/system/primitives"),
  getCoverage: () => request("/system/coverage"),
  getIndexOverview: () => request("/system/index"),
  getMetadataIndex: () => request("/system/metadata-index"),
  getSchema: () => request("/system/schema"),
  getAudioSqlExamples: () => request("/system/audiosql/examples"),
  getCollections: () => request("/collections"),
  createCollection: (payload) =>
    request("/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  uploadAudio: (formData) =>
    request("/audios/upload", {
      method: "POST",
      body: formData,
    }),
  deleteAudio: (id) =>
    request(`/audios/${id}`, {
      method: "DELETE",
    }),
  reanalyzeAudio: (id) =>
    request(`/audios/${id}/reanalyze`, {
      method: "POST",
    }),
  executeAudioSql: (query) =>
    request("/audiosql/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    }),
  searchSimilar: (id) => request(`/search/similar/${id}`),
  searchSimilarByUpload: (formData) =>
    request("/search/similar-upload", {
      method: "POST",
      body: formData,
    }),
  searchMetadata: (q) => request(`/search/metadata?q=${encodeURIComponent(q)}`),
};

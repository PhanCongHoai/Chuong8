const primitiveFunctions = [
  {
    id: "PF01",
    name: "AddAudioSource",
    signature: "AddAudioSource(metadata, binaryAudio)",
    purpose: "Thêm nguồn âm thanh mới vào thư viện và lưu metadata cơ bản.",
    exercise: 1,
    mappedEndpoint: "POST /api/audios/upload",
  },
  {
    id: "PF02",
    name: "SegmentAudio",
    signature: "SegmentAudio(audioId, windowSize, hopSize)",
    purpose: "Chia tín hiệu thành các cửa sổ tương đối đồng nhất.",
    exercise: 1,
    mappedEndpoint: "POST /api/audios/:id/reanalyze",
  },
  {
    id: "PF03",
    name: "ExtractAudioFeatures",
    signature: "ExtractAudioFeatures(audioId)",
    purpose: "Trích đặc trưng như energy, loudness, pitch, brightness, zero-crossing rate.",
    exercise: 1,
    mappedEndpoint: "POST /api/audios/:id/reanalyze",
  },
  {
    id: "PF04",
    name: "CreateAudioIndex",
    signature: "CreateAudioIndex(audioCollection)",
    purpose: "Xây dựng chỉ mục vector và chỉ mục metadata cho toàn bộ thư viện âm thanh.",
    exercise: 2,
    mappedEndpoint: "GET /api/system/index",
  },
  {
    id: "PF05",
    name: "SearchAudioByMetadata",
    signature: "SearchAudioByMetadata(keyword)",
    purpose: "Tra cứu âm thanh qua tiêu đề, mô tả, thẻ, danh mục và nhà nghiên cứu.",
    exercise: 4,
    mappedEndpoint: "GET /api/search/metadata",
  },
  {
    id: "PF06",
    name: "FindSimilarAudio",
    signature: "FindSimilarAudio(audioId, limit)",
    purpose: "Tìm các âm thanh gần nhất trong chỉ mục vector bằng khoảng cách Euclid.",
    exercise: 2,
    mappedEndpoint: "GET /api/search/similar/:id",
  },
  {
    id: "PF07",
    name: "ListAudioSegments",
    signature: "ListAudioSegments(audioId)",
    purpose: "Lấy danh sách các đoạn cửa sổ sau segmentation để phục vụ quan sát và truy vấn.",
    exercise: 2,
    mappedEndpoint: "GET /api/audios/:id/preview",
  },
  {
    id: "PF08",
    name: "ExecuteAudioSQL",
    signature: "ExecuteAudioSQL(query)",
    purpose: "Thực thi truy vấn AudioSQL rút gọn để truy vấn metadata hoặc truy vấn tương tự.",
    exercise: 3,
    mappedEndpoint: "POST /api/audiosql/query",
  },
];

const audioSqlExamples = [
  "SELECT * FROM audios;",
  "SELECT title, category, priority FROM audios WHERE KEYWORD = 'cuoi';",
  "SELECT * FROM audios WHERE CATEGORY = 'Bieu cam con nguoi';",
  "SELECT title, researcher FROM audios WHERE TAG = 'cuoi';",
  "SELECT * FROM audios WHERE SIMILAR_TO = 'audio-001' LIMIT 3;",
  "SHOW PRIMITIVE FUNCTIONS;",
  "SHOW AUDIO INDEX;",
];

export function getPrimitiveFunctions() {
  return primitiveFunctions;
}

export function getAudioSqlExamples() {
  return audioSqlExamples;
}

export function getAudioIndexSchema() {
  return {
    name: "AudioIndex",
    basedOn: "CreateAudioIndex (Algorithm 8.1)",
    layers: [
      {
        name: "AudioSource",
        fields: ["id", "title", "description", "category", "tags", "collectionId", "filePath"],
      },
      {
        name: "WindowVector",
        fields: [
          "audioId",
          "startSecond",
          "endSecond",
          "energy",
          "loudness",
          "pitch",
          "brightness",
          "zeroCrossingRate",
          "peak",
        ],
      },
      {
        name: "VectorIndex",
        fields: ["audioId", "featureVector12D", "dimension", "metric"],
      },
      {
        name: "MetadataIndex",
        fields: ["tokenIndex", "tagIndex", "categoryIndex", "researcherIndex", "collectionIndex"],
      },
    ],
  };
}

export function getExerciseCoverage() {
  return [
    {
      exercise: 1,
      title: "Primitive function calls",
      coverage: "Đã hiện thực bằng bộ primitive functions và các endpoint tương ứng.",
    },
    {
      exercise: 2,
      title: "Extended data structure from CreateAudioIndex",
      coverage: "Đã hiện thực bằng AudioIndex gồm WindowVector, VectorIndex, MetadataIndex.",
    },
    {
      exercise: 3,
      title: "AudioSQL",
      coverage: "Đã hiện thực AudioSQL rút gọn để truy vấn metadata, category, tag và similar search.",
    },
    {
      exercise: 4,
      title: "Metadata indexing scheme",
      coverage: "Đã hiện thực inverted index trên token, tag, category, researcher và collection.",
    },
    {
      exercise: 5,
      title: "Small audio database system",
      coverage: "Đã triển khai giao diện, backend API, chỉ mục âm thanh và dữ liệu seed có thể chạy demo.",
    },
  ];
}

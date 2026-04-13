import {
  filterAudiosByField,
  getAllAudios,
  getAudioIndexOverview,
  searchByKeyword,
  searchSimilarAudios,
} from "./libraryService.js";
import {
  getAudioIndexSchema,
  getAudioSqlExamples,
  getPrimitiveFunctions,
} from "./systemDesignService.js";

function normalizeWhitespace(query) {
  return `${query || ""}`.replace(/\s+/g, " ").trim();
}

function projectColumns(rows, columns) {
  if (columns.length === 1 && columns[0] === "*") {
    return rows;
  }

  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, row[column]]))
  );
}

export function executeAudioSql(query) {
  const normalizedQuery = normalizeWhitespace(query);

  if (!normalizedQuery) {
    throw new Error("Câu lệnh AudioSQL không được để trống.");
  }

  if (/^SHOW PRIMITIVE FUNCTIONS;?$/i.test(normalizedQuery)) {
    return {
      type: "primitive-functions",
      columns: ["id", "name", "signature", "purpose", "mappedEndpoint"],
      rows: getPrimitiveFunctions(),
      executionPlan: ["Đọc định nghĩa primitive functions từ mô hình hệ thống."],
    };
  }

  if (/^SHOW AUDIO INDEX;?$/i.test(normalizedQuery)) {
    return {
      type: "audio-index",
      schema: getAudioIndexSchema(),
      rows: [getAudioIndexOverview()],
      executionPlan: ["Đọc chỉ mục vector, metadata index và segment index hiện tại."],
    };
  }

  if (/^SHOW AUDIOSQL EXAMPLES;?$/i.test(normalizedQuery)) {
    return {
      type: "audiosql-examples",
      columns: ["query"],
      rows: getAudioSqlExamples().map((item) => ({ query: item })),
      executionPlan: ["Trả về tập truy vấn mẫu AudioSQL."],
    };
  }

  const baseSelectMatch = normalizedQuery.match(
    /^SELECT\s+(.+?)\s+FROM\s+(audios|collections)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?;?$/i
  );

  if (!baseSelectMatch) {
    throw new Error("AudioSQL hiện chỉ hỗ trợ SELECT ... FROM audios|collections, SHOW PRIMITIVE FUNCTIONS, SHOW AUDIO INDEX.");
  }

  const rawColumns = baseSelectMatch[1];
  const target = baseSelectMatch[2].toLowerCase();
  const whereClause = baseSelectMatch[3];
  const limit = Number(baseSelectMatch[4] || 50);
  const columns = rawColumns.split(",").map((item) => item.trim());

  if (target === "collections") {
    throw new Error("Phiên bản hiện tại ưu tiên truy vấn trên bảng audios.");
  }

  let rows = getAllAudios();
  const executionPlan = ["Đọc dữ liệu từ bảng logic audios."];

  if (whereClause) {
    const similarMatch = whereClause.match(/^SIMILAR_TO\s*=\s*'(.+?)'$/i);
    const keywordMatch = whereClause.match(/^KEYWORD\s*=\s*'(.+?)'$/i);
    const categoryMatch = whereClause.match(/^CATEGORY\s*=\s*'(.+?)'$/i);
    const tagMatch = whereClause.match(/^TAG\s*=\s*'(.+?)'$/i);
    const researcherMatch = whereClause.match(/^RESEARCHER\s*=\s*'(.+?)'$/i);

    if (similarMatch) {
      rows = searchSimilarAudios(similarMatch[1], limit);
      executionPlan.push("Truy vấn VectorIndex bằng khoảng cách Euclid.");
    } else if (keywordMatch) {
      rows = searchByKeyword(keywordMatch[1]);
      executionPlan.push("Tra cứu trên MetadataIndex token-based.");
    } else if (categoryMatch) {
      rows = filterAudiosByField("category", categoryMatch[1]);
      executionPlan.push("Lọc theo category index.");
    } else if (tagMatch) {
      rows = filterAudiosByField("tag", tagMatch[1]);
      executionPlan.push("Lọc theo tag inverted index.");
    } else if (researcherMatch) {
      rows = filterAudiosByField("researcher", researcherMatch[1]);
      executionPlan.push("Lọc theo researcher index.");
    } else {
      throw new Error("Mệnh đề WHERE chưa được hỗ trợ trong AudioSQL hiện tại.");
    }
  }

  rows = projectColumns(rows.slice(0, limit), columns);

  return {
    type: "select",
    columns,
    rows,
    executionPlan,
  };
}

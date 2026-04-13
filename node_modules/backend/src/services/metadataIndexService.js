function normalizeText(value) {
  return `${value || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function addToBucket(index, key, audioId) {
  if (!key) {
    return;
  }

  if (!index[key]) {
    // Moi key dai dien cho 1 posting list cua chi muc dao.
    index[key] = new Set();
  }

  index[key].add(audioId);
}

function materializeIndex(index) {
  // Chuyen Set sang Array de de tra JSON cho frontend va API.
  return Object.fromEntries(
    Object.entries(index).map(([key, set]) => [key, Array.from(set)])
  );
}

export function buildMetadataIndex(audios, collections = []) {
  const tokenIndex = {};
  const tagIndex = {};
  const categoryIndex = {};
  const researcherIndex = {};
  const collectionIndex = {};

  const collectionMap = new Map(collections.map((collection) => [collection.id, collection]));

  for (const audio of audios) {
    // Gom cac truong metadata co the tim theo tu khoa vao cung 1 nguon van ban.
    const searchableFields = [
      audio.title,
      audio.description,
      audio.category,
      audio.researcher,
      audio.notes,
      collectionMap.get(audio.collectionId)?.name,
      ...(audio.tags || []),
    ];

    // Lap tokenIndex theo dang: token -> [audioId1, audioId2, ...]
    for (const token of tokenize(searchableFields.join(" "))) {
      addToBucket(tokenIndex, token, audio.id);
    }

    // Lap chi muc rieng cho tag de ho tro truy van theo truong tag.
    for (const tag of audio.tags || []) {
      addToBucket(tagIndex, normalizeText(tag), audio.id);
    }

    // Cac chi muc field-based nay giup loc theo category, researcher, collection.
    addToBucket(categoryIndex, normalizeText(audio.category), audio.id);
    addToBucket(researcherIndex, normalizeText(audio.researcher), audio.id);
    addToBucket(collectionIndex, normalizeText(audio.collectionId), audio.id);
  }

  return {
    tokenIndex: materializeIndex(tokenIndex),
    tagIndex: materializeIndex(tagIndex),
    categoryIndex: materializeIndex(categoryIndex),
    researcherIndex: materializeIndex(researcherIndex),
    collectionIndex: materializeIndex(collectionIndex),
    stats: {
      tokenCount: Object.keys(tokenIndex).length,
      tagCount: Object.keys(tagIndex).length,
      categoryCount: Object.keys(categoryIndex).length,
      researcherCount: Object.keys(researcherIndex).length,
      collectionCount: Object.keys(collectionIndex).length,
    },
  };
}

export function searchMetadataIndex(index, audios, query) {
  const tokens = tokenize(query);

  if (!tokens.length) {
    return audios;
  }

  const matchedIds = new Set();

  for (const token of tokens) {
    // Lay posting list cua tung token tu tokenIndex.
    const tokenMatches = index.tokenIndex[token] || [];
    for (const id of tokenMatches) {
      // Query nhieu token hien dang gom ket qua theo kieu OR.
      matchedIds.add(id);
    }
  }

  // Tra lai day du ban ghi audio thay vi chi tra ve danh sach id.
  return audios.filter((audio) => matchedIds.has(audio.id));
}

export function filterByMetadataField(audios, field, rawValue) {
  const target = normalizeText(rawValue);

  return audios.filter((audio) => {
    if (field === "category") {
      return normalizeText(audio.category) === target;
    }

    if (field === "researcher") {
      return normalizeText(audio.researcher) === target;
    }

    if (field === "tag") {
      return (audio.tags || []).some((tag) => normalizeText(tag) === target);
    }

    if (field === "title") {
      return normalizeText(audio.title).includes(target);
    }

    return false;
  });
}

export function normalizeMetadataValue(value) {
  return normalizeText(value);
}

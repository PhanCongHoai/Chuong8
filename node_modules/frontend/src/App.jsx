import { useEffect, useState } from "react";
import { api } from "./api/client.js";
import Layout from "./components/Layout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import CollectionsPage from "./pages/CollectionsPage.jsx";
import AcademicPage from "./pages/AcademicPage.jsx";
import AudioSqlPage from "./pages/AudioSqlPage.jsx";

const initialDashboard = {
  stats: [],
  categoryStats: [],
  recentAudios: [],
};

const initialAcademicState = {
  primitives: [],
  coverage: [],
  indexOverview: null,
  metadataIndex: null,
  schema: null,
  audioSqlExamples: [],
};

function filterAudiosByKeyword(audioPool, keyword) {
  const normalizedKeyword = `${keyword || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (!normalizedKeyword) {
    return audioPool;
  }

  return audioPool.filter((audio) => {
    const searchableText = [
      audio.title,
      audio.description,
      audio.category,
      audio.researcher,
      audio.collectionName,
      audio.notes,
      ...(audio.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return searchableText.includes(normalizedKeyword);
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [audios, setAudios] = useState([]);
  const [libraryAudios, setLibraryAudios] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [preview, setPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchSourceAudio, setSearchSourceAudio] = useState(null);
  const [uploadedSearchQuery, setUploadedSearchQuery] = useState(null);
  const [metadataKeyword, setMetadataKeyword] = useState("");
  const [metadataResults, setMetadataResults] = useState([]);
  const [academicState, setAcademicState] = useState(initialAcademicState);
  const [audioSqlResult, setAudioSqlResult] = useState(null);

  async function loadAudioDetail(audioId, audioPool = audios) {
    if (!audioId) {
      setSelectedAudioId("");
      setSelectedAudio(null);
      setPreview(null);
      return;
    }

    setSelectedAudioId(audioId);

    const localMatch = audioPool.find((audio) => audio.id === audioId);
    const detail = localMatch || (await api.getAudio(audioId));
    setSelectedAudio(detail);

    try {
      const previewData = await api.getPreview(audioId);
      setPreview(previewData);
    } catch {
      setPreview(null);
    }
  }

  async function refreshCoreData(nextSelectedId) {
    const [dashboardData, audioData, collectionData] = await Promise.all([
      api.getDashboard(),
      api.getAudios(),
      api.getCollections(),
    ]);

    setDashboard(dashboardData);
    setAudios(audioData);
    setLibraryAudios(audioData);
    setCollections(collectionData);

    const hasExplicitSelection = nextSelectedId !== undefined;
    const targetId = hasExplicitSelection
      ? nextSelectedId || audioData[0]?.id || ""
      : selectedAudioId || audioData[0]?.id || "";

    if (targetId) {
      await loadAudioDetail(targetId, audioData);
    } else {
      await loadAudioDetail("");
    }
  }

  async function refreshAcademicData() {
    const [
      primitives,
      coverage,
      indexOverview,
      metadataIndex,
      schema,
      audioSqlExamples,
    ] = await Promise.all([
      api.getPrimitiveFunctions(),
      api.getCoverage(),
      api.getIndexOverview(),
      api.getMetadataIndex(),
      api.getSchema(),
      api.getAudioSqlExamples(),
    ]);

    setAcademicState({
      primitives,
      coverage,
      indexOverview,
      metadataIndex,
      schema,
      audioSqlExamples,
    });
  }

  async function refreshApp(nextSelectedId) {
    await Promise.all([refreshCoreData(nextSelectedId), refreshAcademicData()]);
  }

  useEffect(() => {
    refreshApp().catch((error) => {
      console.error(error);
    });
  }, []);

  useEffect(() => {
    setMetadataResults(filterAudiosByKeyword(audios, metadataKeyword));
    setSearchSourceAudio((current) => {
      if (!current) {
        return null;
      }

      const latestSource = audios.find((audio) => audio.id === current.id) || null;

      if (!latestSource) {
        setSearchResults([]);
      }

      return latestSource;
    });
    setSearchResults((current) =>
      current
        .map((item) => {
          const latestAudio = audios.find((audio) => audio.id === item.id);

          if (!latestAudio) {
            return null;
          }

          return {
            ...latestAudio,
            similarity: item.similarity,
          };
        })
        .filter(Boolean)
    );
  }, [audios, metadataKeyword]);

  async function handleUploaded(formData) {
    const record = await api.uploadAudio(formData);
    await refreshApp(record.id);
    setActiveTab("library");
  }

  async function handleReanalyze(audioId) {
    await api.reanalyzeAudio(audioId);
    await refreshApp(audioId);

    if (searchSourceAudio?.id === audioId) {
      const updatedResults = await api.searchSimilar(audioId);
      setSearchResults(updatedResults);
    }
  }

  async function handleDeleteAudio(audioId) {
    await api.deleteAudio(audioId);
    setSearchResults((current) => current.filter((item) => item.id !== audioId));
    setMetadataResults((current) => current.filter((item) => item.id !== audioId));
    setSearchSourceAudio((current) => (current?.id === audioId ? null : current));
    setAudioSqlResult(null);
    await refreshApp("");
  }

  async function handleCreateCollection(payload) {
    await api.createCollection(payload);
    await refreshCoreData(selectedAudioId);
  }

  async function handleSearchMetadata(keyword) {
    const normalizedKeyword = keyword.trim();
    setMetadataKeyword(normalizedKeyword);

    if (!normalizedKeyword) {
      setMetadataResults(audios);
      return;
    }

    const results = await api.searchMetadata(normalizedKeyword);
    setMetadataResults(results);
  }

  async function handlePickSource(audioId) {
    if (!audioId) {
      setSearchSourceAudio(null);
      setUploadedSearchQuery(null);
      setSearchResults([]);
      return;
    }

    const localMatch = audios.find((audio) => audio.id === audioId);
    const detail = localMatch || (await api.getAudio(audioId));
    setSearchSourceAudio(detail);
    setUploadedSearchQuery(null);

    const results = await api.searchSimilar(audioId);
    setSearchResults(results);
  }

  async function handleSearchByUpload(file) {
    if (!file) {
      setUploadedSearchQuery(null);
      setSearchResults([]);
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    const response = await api.searchSimilarByUpload(formData);
    setSearchSourceAudio(null);
    setUploadedSearchQuery(response.query);
    setSearchResults(response.results);
  }

  async function handleExecuteAudioSql(query) {
    const result = await api.executeAudioSql(query);
    setAudioSqlResult(result);
    return result;
  }

  return (
    <Layout activeTab={activeTab} onChangeTab={setActiveTab}>
      {activeTab === "dashboard" && (
        <DashboardPage dashboard={dashboard} onJump={setActiveTab} />
      )}

      {activeTab === "library" && (
        <LibraryPage
          audios={libraryAudios}
          activeTab={activeTab}
          selectedAudio={selectedAudio}
          preview={preview}
          onSelect={loadAudioDetail}
          onDelete={handleDeleteAudio}
          onReanalyze={handleReanalyze}
        />
      )}

      {activeTab === "upload" && (
        <UploadPage collections={collections} onUploaded={handleUploaded} />
      )}

      {activeTab === "search" && (
        <SearchPage
          audios={audios}
          selectedAudio={searchSourceAudio}
          uploadedQuery={uploadedSearchQuery}
          metadataResults={metadataResults}
          results={searchResults}
          onSearchMetadata={handleSearchMetadata}
          onPickSource={handlePickSource}
          onSearchByUpload={handleSearchByUpload}
        />
      )}

      {activeTab === "collections" && (
        <CollectionsPage
          collections={collections}
          onCreateCollection={handleCreateCollection}
        />
      )}

      {activeTab === "academic" && (
        <AcademicPage
          primitives={academicState.primitives}
          coverage={academicState.coverage}
          indexOverview={academicState.indexOverview}
          metadataIndex={academicState.metadataIndex}
          schema={academicState.schema}
        />
      )}

      {activeTab === "audiosql" && (
        <AudioSqlPage
          examples={academicState.audioSqlExamples}
          result={audioSqlResult}
          onExecute={handleExecuteAudioSql}
        />
      )}
    </Layout>
  );
}

import { useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

export default function SearchPage({
  audios,
  selectedAudio,
  uploadedQuery,
  metadataResults,
  results,
  onSearchMetadata,
  onPickSource,
  onSearchByUpload,
}) {
  const [keyword, setKeyword] = useState("");
  const [queryFile, setQueryFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const analyzedAudios = audios.filter((audio) => audio.featureVector?.length);

  function handleKeywordSubmit(event) {
    event.preventDefault();
    onSearchMetadata(keyword);
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    if (!queryFile) {
      return;
    }

    setIsUploading(true);
    try {
      await onSearchByUpload(queryFile);
    } finally {
      setIsUploading(false);
    }
  }

  const activeQueryTitle = uploadedQuery?.fileName || selectedAudio?.title || "";
  const activeQueryDescription = uploadedQuery
    ? `Tệp truy vấn tải lên: ${uploadedQuery.fileName}`
    : selectedAudio?.description || "Bản ghi nguồn chưa có mô tả.";
  const activeQueryBadges = uploadedQuery
    ? [
        uploadedQuery.summary?.formatName,
        uploadedQuery.durationSeconds
          ? `${uploadedQuery.durationSeconds} giây`
          : "",
      ].filter(Boolean)
    : [selectedAudio?.category, selectedAudio?.analysisStatus].filter(Boolean);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Tìm kiếm"
        title="Tìm âm thanh theo nội dung hoặc tệp truy vấn"
        description="Bạn có thể chọn một bản ghi có sẵn hoặc tải tệp âm thanh lên để so sánh theo khoảng cách Euclid."
      />

      <div className="content-grid two-column-balanced">
        <section className="surface-card panel-stack">
          <SectionHeader
            title="Tìm âm thanh tương tự"
            description="Chọn bản ghi trong thư viện hoặc tải tệp âm thanh lên để hệ thống so sánh."
          />

          <label className="field-block">
            <span>Âm thanh nguồn trong thư viện</span>
            <select
              value={selectedAudio?.id || ""}
              onChange={(event) => onPickSource(event.target.value)}
            >
              <option value="">Chọn bản ghi đã có đặc trưng</option>
              {analyzedAudios.map((audio) => (
                <option key={audio.id} value={audio.id}>
                  {audio.title}
                </option>
              ))}
            </select>
          </label>

          <form className="form-stack" onSubmit={handleUploadSubmit}>
            <label className="field-block">
              <span>Tải tệp để tìm kiếm bằng âm thanh</span>
              <input
                type="file"
                accept=".wav,.mp3,audio/*"
                onChange={(event) => setQueryFile(event.target.files?.[0] || null)}
              />
            </label>
            <button type="submit" className="secondary-button" disabled={!queryFile || isUploading}>
              {isUploading ? "Đang phân tích tệp..." : "Tải lên và so sánh"}
            </button>
          </form>

          {activeQueryTitle ? (
            <article className="query-source-card">
              <div className="info-card-top">
                {activeQueryBadges.map((badge) => (
                  <span key={badge} className="soft-badge">
                    {badge}
                  </span>
                ))}
              </div>
              <h4>{activeQueryTitle}</h4>
              <p>{activeQueryDescription}</p>
            </article>
          ) : null}

          {results.length ? (
            <div className="result-list">
              {results.map((item) => (
                <article key={item.id} className="result-card">
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description || "Không có mô tả cho bản ghi này."}</p>
                  </div>

                  <div className="result-score">
                    <span>Trùng khớp Euclid</span>
                    <strong>{(item.similarity * 100).toFixed(2)}%</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có kết quả tương tự"
              description="Hãy chọn một bản ghi hoặc tải tệp âm thanh lên để hệ thống so sánh."
            />
          )}
        </section>

        <section className="surface-card panel-stack">
          <SectionHeader
            title="Tìm theo từ khóa"
            description="Lọc theo tiêu đề, mô tả, thẻ, danh mục hoặc người phụ trách."
          />

          <form className="search-inline" onSubmit={handleKeywordSubmit}>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Nhập từ khóa..."
            />
            <button type="submit" className="secondary-button">
              Tìm kiếm
            </button>
          </form>

          <div className="callout-card">
            <strong>Gợi ý</strong>
            <p>Thử các từ khóa như vỗ tay, trống, chuông hoặc tên bộ sưu tập.</p>
          </div>

          {metadataResults?.length ? (
            <div className="result-list">
              {metadataResults.map((item) => (
                <article key={item.id} className="result-card">
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.description || "Không có mô tả cho bản ghi này."}</p>
                  </div>

                  <div className="result-score">
                    <span>Danh mục</span>
                    <strong>{item.category}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có kết quả từ khóa"
              description="Nhập từ khóa và nhấn Tìm kiếm để xem các bản ghi phù hợp ngay tại đây."
            />
          )}
        </section>
      </div>
    </section>
  );
}

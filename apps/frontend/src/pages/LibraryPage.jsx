import { useEffect, useRef } from "react";
import AudioTable from "../components/AudioTable.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import SignalChart from "../components/SignalChart.jsx";

export default function LibraryPage({
  audios,
  activeTab,
  selectedAudio,
  preview,
  onDelete,
  onSelect,
  onReanalyze,
}) {
  const audioRef = useRef(null);
  const audioSourceUrl = selectedAudio?.publicFilePath
    ? `http://localhost:4000${selectedAudio.publicFilePath}`
    : "";

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.load();
  }, [activeTab, audioSourceUrl]);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Kho am thanh"
        title="Danh sach ban ghi va phan xem chi tiet"
        description="Bo cuc hai cot giup bang du lieu, thong tin chi tiet va bieu do tin hieu de quan sat hon."
      />

      <div className="content-grid library-layout">
        <section className="surface-card">
          <SectionHeader
            title="Danh sach ban ghi"
            description="Chon mot dong de xem chi tiet am thanh."
          />
          <AudioTable
            audios={audios}
            selectedId={selectedAudio?.id}
            onSelect={onSelect}
          />
        </section>

        <div className="panel-stack">
          <section className="surface-card">
            <SectionHeader
              title="Chi tiet ban ghi"
              description="Thong tin mo ta va cac chi so chinh cua am thanh."
              action={
                selectedAudio ? (
                  <div className="action-row">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => onReanalyze(selectedAudio.id)}
                    >
                      Phan tich lai
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => onDelete(selectedAudio.id)}
                    >
                      Xoa ban ghi
                    </button>
                  </div>
                ) : null
              }
            />

            {selectedAudio ? (
              <div className="detail-stack">
                <div className="detail-hero">
                  <div>
                    <h4>{selectedAudio.title}</h4>
                    <p>{selectedAudio.description || "Ban ghi nay chua co mo ta."}</p>
                  </div>
                  <div className="detail-badges">
                    <span className="soft-badge">{selectedAudio.category}</span>
                    <span className="soft-badge">{selectedAudio.analysisStatus}</span>
                  </div>
                </div>

                <div className="detail-grid">
                  <article className="detail-item">
                    <span>Bo suu tap</span>
                    <strong>{selectedAudio.collectionName || "Chua gan"}</strong>
                  </article>
                  <article className="detail-item">
                    <span>Nguoi phu trach</span>
                    <strong>{selectedAudio.researcher}</strong>
                  </article>
                  <article className="detail-item">
                    <span>Muc uu tien</span>
                    <strong>{selectedAudio.priority}</strong>
                  </article>
                  <article className="detail-item">
                    <span>Thoi luong</span>
                    <strong>
                      {selectedAudio.durationSeconds
                        ? `${selectedAudio.durationSeconds} giay`
                        : "--"}
                    </strong>
                  </article>
                </div>

                <div className="tag-row">
                  {(selectedAudio.tags || []).map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>

                {audioSourceUrl ? (
                  <div className="audio-player-card">
                    <span className="audio-player-label">Nghe truc tiep tep am thanh</span>
                    <audio
                      key={audioSourceUrl}
                      ref={audioRef}
                      src={audioSourceUrl}
                      controls
                      preload="metadata"
                      className="audio-player"
                    >
                      Trinh duyet khong ho tro phat am thanh.
                    </audio>
                  </div>
                ) : null}

                {selectedAudio.summary ? (
                  <div className="metric-grid">
                    <article className="metric-card">
                      <strong>{selectedAudio.summary.sampleRate} Hz</strong>
                      <span>Tần số lấy mẫu</span>
                    </article>
                    <article className="metric-card">
                      <strong>{selectedAudio.summary.dominantPitchHz} Hz</strong>
                      <span>Cao độ trội</span>
                    </article>
                    <article className="metric-card">
                      <strong>{selectedAudio.summary.averageLoudnessDb} dB</strong>
                      <span>Độ to trung bình</span>
                    </article>
                    <article className="metric-card">
                      <strong>{selectedAudio.summary.normalizedBrightness}</strong>
                      <span>Độ sáng chuẩn hóa</span>
                    </article>
                  </div>
                ) : (
                  <EmptyState
                    title="Chua co bao cao tin hieu"
                    description="Ban ghi nay chua co du lieu phan tich de hien thi."
                  />
                )}
              </div>
            ) : (
              <EmptyState
                title="Chua chon ban ghi"
                description="Hay chon mot dong trong bang de xem thong tin chi tiet."
              />
            )}
          </section>

          <section className="surface-card">
            <SectionHeader
              title="Duong bao nang luong"
              description="Bieu do duoc lam muot tu toan bo tin hieu de phan anh dang thuc te ro hon."
            />
            <SignalChart
              points={preview?.points || []}
              durationSeconds={preview?.durationSeconds || selectedAudio?.durationSeconds}
            />
          </section>
        </div>
      </div>
    </section>
  );
}

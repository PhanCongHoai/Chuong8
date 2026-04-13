import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import StatCard from "../components/StatCard.jsx";

const coverageLabelMap = {
  1: "Thiết kế hàm nguyên thủy",
  2: "Cấu trúc chỉ mục âm thanh",
  3: "Ngôn ngữ truy vấn AudioSQL",
  4: "Lập chỉ mục thông tin mô tả",
  5: "Hệ cơ sở dữ liệu âm thanh",
};

const schemaLabelMap = {
  AudioSource: "Nguồn âm thanh",
  WindowVector: "Vector theo cửa sổ",
  VectorIndex: "Chỉ mục vector",
  MetadataIndex: "Chỉ mục mô tả",
};

export default function AcademicPage({
  primitives,
  coverage,
  indexOverview,
  metadataIndex,
  schema,
}) {
  const overviewStats = indexOverview
    ? [
        {
          label: "Số mục trong chỉ mục vector",
          value: indexOverview.vectorIndex?.itemCount || 0,
          note: "Số bản ghi đã sẵn sàng cho tìm kiếm tương tự.",
        },
        {
          label: "Số chiều vector",
          value: indexOverview.vectorIndex?.dimension || 0,
          note: "Kích thước vector đại diện cho mỗi âm thanh.",
        },
        {
          label: "Số mục phân đoạn",
          value: indexOverview.segmentIndex?.length || 0,
          note: "Số bản ghi có dữ liệu phân đoạn tín hiệu.",
        },
        {
          label: "Số từ khóa mô tả",
          value: metadataIndex?.stats?.tokenCount || 0,
          note: "Tổng số từ khóa trong chỉ mục mô tả.",
        },
      ]
    : [];

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Bài tập 1-5"
        title="Tổng hợp phần học thuật của đồ án"
        description="Trang này trình bày ngắn gọn cách hệ thống bao phủ toàn bộ yêu cầu từ bài 1 đến bài 5."
      />

      {overviewStats.length ? (
        <div className="stats-grid">
          {overviewStats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>
      ) : null}

      <div className="content-grid two-column-balanced">
        <section className="surface-card">
          <SectionHeader
            title="Mức độ bao phủ"
            description="Mỗi dòng cho biết hệ thống đã hiện thực phần nào của đề."
          />

          {coverage.length ? (
            <div className="coverage-list">
              {coverage.map((item) => (
                <article key={item.exercise} className="coverage-card">
                  <div className="coverage-head">
                    <span className="coverage-badge">Bài {item.exercise}</span>
                    <h4>{coverageLabelMap[item.exercise] || `Bài ${item.exercise}`}</h4>
                  </div>
                  <p>{item.coverage}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có dữ liệu"
              description="Thông tin bao phủ bài tập sẽ hiển thị tại đây."
            />
          )}
        </section>

        <section className="surface-card">
          <SectionHeader
            title="Cấu trúc chỉ mục âm thanh"
            description="Thể hiện các lớp dữ liệu chính trong hệ thống."
          />

          {schema?.layers?.length ? (
            <div className="schema-list">
              {schema.layers.map((layer) => (
                <article key={layer.name} className="schema-card">
                  <h4>{schemaLabelMap[layer.name] || layer.name}</h4>
                  <p>{layer.fields.join(", ")}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có cấu trúc"
              description="Thông tin cấu trúc sẽ hiển thị khi backend sẵn sàng."
            />
          )}
        </section>
      </div>

      <div className="content-grid two-column-balanced">
        <section className="surface-card">
          <SectionHeader
            title="Các hàm nguyên thủy"
            description="Danh sách các hàm nền tảng dùng cho quản lý và truy vấn âm thanh."
          />

          {primitives.length ? (
            <div className="primitive-grid">
              {primitives.map((item) => (
                <article key={item.id} className="primitive-card">
                  <div className="info-card-top">
                    <span className="soft-badge">{item.id}</span>
                    <span className="soft-badge">Bài {item.exercise}</span>
                  </div>
                  <h4>Chức năng {item.id}</h4>
                  <p>{item.purpose}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có hàm nguyên thủy"
              description="Danh sách hàm sẽ hiển thị tại đây."
            />
          )}
        </section>

        <section className="surface-card panel-stack">
          <SectionHeader
            title="Mẫu từ khóa mô tả"
            description="Một số từ khóa và thẻ dùng để lập chỉ mục mô tả."
          />

          <div className="token-panel">
            <strong>Từ khóa</strong>
            {metadataIndex?.sampleTokens?.length ? (
              <div className="token-list">
                {metadataIndex.sampleTokens.map((item) => (
                  <span key={item.token} className="token-pill">
                    {item.token}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted-copy">Chưa có dữ liệu từ khóa.</p>
            )}
          </div>

          <div className="token-panel">
            <strong>Thẻ mô tả</strong>
            {metadataIndex?.sampleTags?.length ? (
              <div className="token-list">
                {metadataIndex.sampleTags.map((item) => (
                  <span key={item.tag} className="token-pill">
                    {item.tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted-copy">Chưa có dữ liệu thẻ.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

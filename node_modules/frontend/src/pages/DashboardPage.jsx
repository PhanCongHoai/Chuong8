import SectionHeader from "../components/SectionHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import EmptyState from "../components/EmptyState.jsx";

function handleKeyboardJump(event, onJump, tabId) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onJump(tabId);
  }
}

export default function DashboardPage({ dashboard, onJump }) {
  return (
    <section className="page-stack">
      <div className="stats-grid">
        {dashboard.stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="content-grid two-column-balanced">
        <section className="surface-card">
          <SectionHeader
            title="Phân bố theo danh mục"
            description="Cho biết số lượng bản ghi trong từng nhóm âm thanh."
          />

          {dashboard.categoryStats?.length ? (
            <div className="metric-grid">
              {dashboard.categoryStats.map((item) => (
                <article key={item.name} className="metric-card">
                  <strong>{item.count}</strong>
                  <span>{item.name}</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có danh mục"
              description="Dữ liệu sẽ xuất hiện tại đây sau khi bạn tải tệp âm thanh."
            />
          )}
        </section>

        <section className="surface-card">
          <SectionHeader
            title="Lối tắt thao tác"
            description="Ba khu vực chính giúp bạn đi nhanh đến chức năng cần dùng."
          />

          <div className="callout-stack">
            <article
              className="callout-card callout-card-clickable"
              onClick={() => onJump("upload")}
              onKeyDown={(event) => handleKeyboardJump(event, onJump, "upload")}
              role="button"
              tabIndex={0}
            >
              <strong>Tải dữ liệu</strong>
              <p>Thêm tệp âm thanh và nhập thông tin mô tả cơ bản.</p>
            </article>

            <article
              className="callout-card callout-card-clickable"
              onClick={() => onJump("library")}
              onKeyDown={(event) => handleKeyboardJump(event, onJump, "library")}
              role="button"
              tabIndex={0}
            >
              <strong>Kho âm thanh</strong>
              <p>Xem chi tiết bản ghi, đặc trưng tín hiệu và biểu đồ năng lượng.</p>
            </article>

            <article
              className="callout-card callout-card-clickable"
              onClick={() => onJump("search")}
              onKeyDown={(event) => handleKeyboardJump(event, onJump, "search")}
              role="button"
              tabIndex={0}
            >
              <strong>Tìm kiếm</strong>
              <p>Tra cứu theo từ khóa hoặc tìm bản ghi âm thanh tương tự.</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}

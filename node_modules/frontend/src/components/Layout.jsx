const navigationItems = [
  { id: "dashboard", label: "Tổng quan" },
  { id: "library", label: "Kho âm thanh" },
  { id: "upload", label: "Tải dữ liệu" },
  { id: "search", label: "Tìm kiếm" },
  { id: "collections", label: "Bộ sưu tập" },
  { id: "academic", label: "Bài tập 1-5" },
  { id: "audiosql", label: "Truy vấn AudioSQL" },
];

export default function Layout({
  activeTab,
  onChangeTab,
  children,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar-shell">
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeTab ? "nav-chip active" : "nav-chip"}
              onClick={() => onChangeTab(item.id)}
            >
              <span className="nav-chip-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="page-shell">
        <div className="workspace-grid">{children}</div>
      </main>
    </div>
  );
}

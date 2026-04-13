import EmptyState from "./EmptyState.jsx";

export default function AudioTable({ audios, onSelect, selectedId }) {
  if (!audios.length) {
    return (
      <EmptyState
        title="Kho âm thanh đang trống"
        description="Hãy tải dữ liệu để bắt đầu lập chỉ mục và truy vấn."
      />
    );
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Bản ghi</th>
            <th>Danh mục</th>
            <th>Bộ sưu tập</th>
            <th>Trạng thái</th>
            <th>Thời lượng</th>
          </tr>
        </thead>

        <tbody>
          {audios.map((audio) => (
            <tr
              key={audio.id}
              className={audio.id === selectedId ? "table-row active" : "table-row"}
              onClick={() => onSelect(audio.id)}
            >
              <td>
                <div className="table-title-cell">
                  <strong>{audio.title}</strong>
                  <span>{audio.tags?.join(", ") || "Chưa có thẻ mô tả"}</span>
                </div>
              </td>
              <td>{audio.category}</td>
              <td>{audio.collectionName || "Chưa gắn"}</td>
              <td>
                <span className="soft-badge">{audio.analysisStatus}</span>
              </td>
              <td>{audio.durationSeconds ? `${audio.durationSeconds} giây` : "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

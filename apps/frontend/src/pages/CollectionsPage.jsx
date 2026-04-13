import { useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

export default function CollectionsPage({ collections, onCreateCollection }) {
  const [form, setForm] = useState({
    name: "",
    purpose: "",
    color: "#3b82f6",
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreateCollection(form);
    setForm({
      name: "",
      purpose: "",
      color: "#3b82f6",
    });
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Bộ sưu tập"
        title="Quản lý nhóm dữ liệu âm thanh"
        description="Trang này giữ lại danh sách bộ sưu tập và biểu mẫu tạo mới."
      />

      <div className="content-grid two-column-balanced">
        <section className="surface-card panel-stack">
          <SectionHeader
            title="Danh sách bộ sưu tập"
            description="Mỗi thẻ hiển thị tên, màu nhận diện và mục đích sử dụng."
          />

          {collections.length ? (
            <div className="card-grid">
              {collections.map((collection) => (
                <article key={collection.id} className="collection-card">
                  <div
                    className="collection-color"
                    style={{ backgroundColor: collection.color }}
                  />
                  <div>
                    <h4>{collection.name}</h4>
                    <p>{collection.purpose || "Chưa có mô tả mục đích sử dụng."}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có bộ sưu tập"
              description="Tạo bộ sưu tập mới để tổ chức dữ liệu theo từng nhóm."
            />
          )}
        </section>

        <form className="surface-card form-stack" onSubmit={handleSubmit}>
          <SectionHeader
            title="Tạo bộ sưu tập"
            description="Nhập tên, mục đích và màu nhận diện."
          />

          <label className="field-block">
            <span>Tên bộ sưu tập</span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ví dụ: Âm thanh môi trường"
            />
          </label>

          <label className="field-block">
            <span>Mục đích sử dụng</span>
            <textarea
              rows="5"
              value={form.purpose}
              onChange={(event) => updateField("purpose", event.target.value)}
              placeholder="Mô tả phạm vi dữ liệu và mục đích truy vấn."
            />
          </label>

          <label className="field-block">
            <span>Màu nhận diện</span>
            <input
              type="color"
              value={form.color}
              onChange={(event) => updateField("color", event.target.value)}
            />
          </label>

          <button type="submit" className="primary-button">
            Tạo bộ sưu tập
          </button>
        </form>
      </div>
    </section>
  );
}

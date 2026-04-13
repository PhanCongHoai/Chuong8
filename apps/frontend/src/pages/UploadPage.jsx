import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

const initialForm = {
  title: "",
  description: "",
  category: "Âm thanh mẫu",
  tags: "",
  collectionId: "",
  researcher: "Sinh viên thực hiện",
  priority: "Cao",
  notes: "",
};

export default function UploadPage({ collections, onUploaded }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (file) {
        formData.append("audio", file);
      }

      await onUploaded(formData);
      setForm(initialForm);
      setFile(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Tải dữ liệu"
        title="Thêm bản ghi âm thanh mới"
        description="Biểu mẫu được rút gọn để chỉ giữ lại những thông tin cần thiết nhất."
      />

      <div className="content-grid two-column-balanced">
        <form className="surface-card form-stack" onSubmit={handleSubmit}>
          <SectionHeader
            title="Thông tin bản ghi"
            description="Nhập dữ liệu mô tả trước khi tải tệp âm thanh."
          />

          <div className="form-grid">
            <label className="field-block">
              <span>Tên bản ghi</span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Ví dụ: Tiếng trống ngoài trời"
              />
            </label>

            <label className="field-block">
              <span>Danh mục</span>
              <input
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                placeholder="Ví dụ: Tiếng chuông"
              />
            </label>
          </div>

          <label className="field-block">
            <span>Mô tả</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Mô tả ngắn về nguồn dữ liệu và mục đích sử dụng."
            />
          </label>

          <div className="form-grid">
            <label className="field-block">
              <span>Bộ sưu tập</span>
              <select
                value={form.collectionId}
                onChange={(event) => updateField("collectionId", event.target.value)}
              >
                <option value="">Dùng bộ sưu tập mặc định</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span>Mức ưu tiên</span>
              <select
                value={form.priority}
                onChange={(event) => updateField("priority", event.target.value)}
              >
                <option value="Cao">Cao</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Thấp">Thấp</option>
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label className="field-block">
              <span>Người phụ trách</span>
              <input
                value={form.researcher}
                onChange={(event) => updateField("researcher", event.target.value)}
                placeholder="Ví dụ: Nhóm nghiên cứu A"
              />
            </label>

            <label className="field-block">
              <span>Thẻ mô tả</span>
              <input
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="Ví dụ: vỗ tay, sân khấu, lớn"
              />
            </label>
          </div>

          <label className="field-block">
            <span>Ghi chú</span>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Thông tin thêm về bản quyền, chất lượng hoặc điều kiện thu âm."
            />
          </label>

          <label className="field-block">
            <span>Tệp âm thanh</span>
            <input
              type="file"
              accept=".wav,.mp3,audio/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Đang tải dữ liệu..." : "Lưu bản ghi"}
          </button>
        </form>

        <section className="surface-card panel-stack">
          <SectionHeader
            title="Lưu ý"
            description="Sau khi tải tệp, hệ thống sẽ tự phân tích và tạo đặc trưng âm thanh."
          />

          <div className="callout-stack">
            <article className="callout-card">
              <strong>Tệp hỗ trợ</strong>
              <p>Hệ thống tiếp nhận tệp WAV và MP3.</p>
            </article>
            <article className="callout-card">
              <strong>Phân tích tự động</strong>
              <p>Dữ liệu tín hiệu sẽ được xử lý ngay sau khi lưu bản ghi.</p>
            </article>
            <article className="callout-card">
              <strong>Tra cứu nhanh</strong>
              <p>Sau khi lưu, bản ghi có thể dùng cho tìm kiếm và so sánh tương tự.</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}

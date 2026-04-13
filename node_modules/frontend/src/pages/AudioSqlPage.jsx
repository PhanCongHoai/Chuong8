import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

export default function AudioSqlPage({ examples, result, onExecute }) {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!query && examples.length) {
      setQuery(examples[0]);
    }
  }, [examples, query]);

  async function handleRun() {
    if (!query.trim()) {
      return;
    }

    setRunning(true);

    try {
      await onExecute(query);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="AudioSQL"
        title="Khu vực chạy câu lệnh truy vấn"
        description="Bố cục được rút gọn còn hai phần: nhập câu lệnh và xem kết quả."
      />

      <div className="content-grid two-column-balanced">
        <section className="surface-card panel-stack">
          <SectionHeader
            title="Nhập câu lệnh"
            description="Bạn có thể dùng câu lệnh mẫu hoặc tự nhập."
            action={
              <button
                type="button"
                className="primary-button"
                onClick={handleRun}
                disabled={running}
              >
                {running ? "Đang chạy..." : "Chạy truy vấn"}
              </button>
            }
          />

          <textarea
            className="query-editor"
            rows="8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập câu lệnh AudioSQL"
          />

          <div className="example-list">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className="example-chip"
                onClick={() => setQuery(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card panel-stack">
          <SectionHeader
            title="Kết quả"
            description="Hiển thị dữ liệu, cấu trúc hoặc kế hoạch thực thi."
          />

          {result ? (
            <>
              {result.executionPlan?.length ? (
                <div className="callout-card">
                  <strong>Kế hoạch thực thi</strong>
                  <p>{result.executionPlan.join(" ")}</p>
                </div>
              ) : null}

              {result.schema ? (
                <div className="schema-list">
                  {result.schema.layers.map((layer) => (
                    <article key={layer.name} className="schema-card">
                      <h4>{layer.name}</h4>
                      <p>{layer.fields.join(", ")}</p>
                    </article>
                  ))}
                </div>
              ) : null}

              {result.rows?.length ? (
                <div className="table-shell">
                  <table className="data-table compact">
                    <thead>
                      <tr>
                        {Object.keys(result.rows[0]).map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {result.rows.map((row, index) => (
                        <tr key={`${index}-${Object.values(row).join("-")}`}>
                          {Object.entries(row).map(([column, value]) => (
                            <td key={column}>
                              {Array.isArray(value)
                                ? value.join(", ")
                                : typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : `${value}`}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="Chưa có kết quả"
              description="Chọn một câu lệnh mẫu và nhấn chạy truy vấn."
            />
          )}
        </section>
      </div>
    </section>
  );
}

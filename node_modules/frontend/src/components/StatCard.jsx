export default function StatCard({ label, value, note }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <p className="stat-note">{note}</p>
    </article>
  );
}

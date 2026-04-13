export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state-card">
      <h4>{title}</h4>
      <p>{description}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

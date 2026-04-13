export default function SectionHeader({ title, description, action }) {
  return (
    <div className="section-header">
      <div>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>

      {action ? <div className="section-action">{action}</div> : null}
    </div>
  );
}

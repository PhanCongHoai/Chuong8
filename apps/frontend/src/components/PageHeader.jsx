export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}) {
  return (
    <header className="page-header-card">
      <div className="page-header-copy">
        {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        <p>{description}</p>

        {meta ? <div className="page-meta-row">{meta}</div> : null}
      </div>

      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

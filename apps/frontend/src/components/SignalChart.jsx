import EmptyState from "./EmptyState.jsx";

function buildAreaPath(points, width, height, padding) {
  if (points.length < 2) {
    return "";
  }

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const path = points.map((point, index) => {
    const x = padding + (index / Math.max(1, points.length - 1)) * chartWidth;
    const y = padding + (1 - point.level) * chartHeight;
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  });

  const lastX = padding + chartWidth;
  const baseY = padding + chartHeight;

  return `${path.join(" ")} L ${lastX} ${baseY} L ${padding} ${baseY} Z`;
}

function buildLinePath(points, width, height, padding) {
  if (points.length < 2) {
    return "";
  }

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return points
    .map((point, index) => {
      const x = padding + (index / Math.max(1, points.length - 1)) * chartWidth;
      const y = padding + (1 - point.level) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function SignalChart({ points, durationSeconds }) {
  if (!points?.length) {
    return (
      <EmptyState
        title="Chưa có dữ liệu tín hiệu"
        description="Tải tệp WAV hoặc MP3 và phân tích để xem đường bao năng lượng."
      />
    );
  }

  const width = 760;
  const height = 250;
  const padding = 18;
  const areaPath = buildAreaPath(points, width, height, padding);
  const linePath = buildLinePath(points, width, height, padding);
  const lastPointTime = points[points.length - 1]?.timeSecond || 0;

  return (
    <div className="signal-card">
      <div className="signal-chart signal-chart-svg">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="energyArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#energyArea)" />
          <path d={linePath} fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="signal-legend">
        <span>0 giây</span>
        <span>Đường bao năng lượng thực tế</span>
        <span>{Math.round(durationSeconds || lastPointTime)} giây</span>
      </div>
    </div>
  );
}

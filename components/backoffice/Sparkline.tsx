interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = "var(--accent)",
  height = 32,
  width,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const svgWidth = width ?? data.length * 8;
  const padding = 2;
  const chartHeight = height - padding * 2;
  const stepX = (svgWidth - padding * 2) / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - ((v - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const gradientId = `sparkline-${data.length}-${data[0] ?? 0}`;

  // Area fill path
  const firstX = padding;
  const lastX = padding + (data.length - 1) * stepX;
  const areaPath = `M${firstX},${padding + chartHeight} L${points.replace(/ /g, " L")} L${lastX},${padding + chartHeight} Z`;

  return (
    <svg
      width={svgWidth}
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

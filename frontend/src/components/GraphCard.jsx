import React from 'react';

function getSeriesMax(series) {
  try {
    const allValues = series.flatMap(item => item.values || []);
    const max = Math.max(...allValues);
    return isFinite(max) ? max : 1;
  } catch (e) {
    console.warn('Error calculating series max:', e);
    return 1;
  }
}

export default function GraphCard({ data }) {
  try {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const chartType = (data.chartType || 'bar').toLowerCase();
    const title = String(data.title || 'Generated chart');
    const labels = Array.isArray(data.labels) ? data.labels.slice(0, 8).map(String) : [];
    const series = Array.isArray(data.series) ? data.series.filter(s => Array.isArray(s.values)) : [];

    if (!labels.length || !series.length || !series[0].values?.length) {
      return null;
    }

    const maxValue = getSeriesMax(series);
    if (!isFinite(maxValue) || maxValue <= 0) {
      return null;
    }

    const renderBarChart = () => {
      const barWidth = 40;
      const spacing = 60;
      const chartWidth = labels.length * spacing + 60;

      return (
        <svg viewBox={`0 0 ${Math.min(chartWidth, 500)} 240`} className="graph-svg" style={{ maxWidth: '100%', height: 'auto' }}>
          <defs>
            <linearGradient id="gradBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {labels.map((label, idx) => {
            const value = Number(series[0]?.values?.[idx]) || 0;
            const height = Math.max(0, (value / maxValue) * 130);
            const x = 40 + idx * spacing;
            const y = 180 - height;

            return (
              <g key={`bar-${idx}`}>
                <rect x={x} y={y} width={barWidth} height={height} rx="4" fill="url(#gradBar)" />
                {value > 0 && (
                  <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="graph-value" fontSize="11">
                    {Math.round(value)}
                  </text>
                )}
                <text x={x + barWidth / 2} y="205" textAnchor="middle" className="graph-label" fontSize="10">
                  {String(label).substring(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>
      );
    };

    const renderLineChart = () => {
      const chartWidth = Math.max(300, labels.length * 50);
      const points = series[0]?.values?.map((value, idx) => {
        const x = 40 + idx * ((chartWidth - 80) / Math.max(labels.length - 1, 1));
        const y = 180 - Math.max(0, (Number(value) || 0) / maxValue) * 130;
        return { x, y, value: Number(value) || 0 };
      }) || [];

      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      return (
        <svg viewBox={`0 0 ${chartWidth} 240`} className="graph-svg" style={{ maxWidth: '100%', height: 'auto' }}>
          <defs>
            <linearGradient id="gradLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          <path d={pathD} fill="none" stroke="url(#gradLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, idx) => (
            <circle key={`point-${idx}`} cx={p.x} cy={p.y} r="3" fill="#a78bfa" />
          ))}

          {labels.map((label, idx) => (
            <text key={`label-${idx}`} x={40 + idx * ((chartWidth - 80) / Math.max(labels.length - 1, 1))} y="220" textAnchor="middle" className="graph-label" fontSize="10">
              {String(label).substring(0, 8)}
            </text>
          ))}
        </svg>
      );
    };

    return (
      <div className="graph-card">
        <div className="graph-card-header">
          <div>
            <p className="graph-card-kicker">Auto-generated chart</p>
            <h4>{title}</h4>
          </div>
          <span className="graph-card-tag">{chartType.toUpperCase()}</span>
        </div>

        <div style={{ overflow: 'auto' }}>
          {chartType === 'line' ? renderLineChart() : renderBarChart()}
        </div>

        <div className="graph-series-list">
          {series.map((item, idx) => (
            <div key={`series-${idx}`} className="graph-series-chip">
              <span className="graph-series-dot" />
              <strong>{String(item.name || `Series ${idx + 1}`).substring(0, 20)}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('GraphCard error:', error);
    return (
      <div className="graph-card" style={{ padding: '12px', color: '#f43f5e' }}>
        <p>⚠️ Failed to render chart</p>
      </div>
    );
  }
}

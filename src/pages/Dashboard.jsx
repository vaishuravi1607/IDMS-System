import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import Layout from "../components/Layout";
import { db } from "../firebase";

function monthShort(date) {
  return date.toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function safeDate(value) {
  if (!value) return null;

  if (value?.toDate) return value.toDate();

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildLast3Months() {
  const now = new Date();
  const months = [];

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: monthShort(d),
      incoming: 0,
      outgoing: 0,
    });
  }

  return months;
}

function getTypeColor(index) {
  const colors = ["#4dd9a5", "#2fbf91", "#82f0c3", "#1da87d", "#68e3b7", "#a1f5d7"];
  return colors[index % colors.length];
}

function PieChartSvg({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <div className="dashboard-empty-chart">No type data</div>;
  }

  const radius = 88;
  const cx = 120;
  const cy = 120;
  let startAngle = -90;

  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, r, start, end) => {
    const startPoint = polarToCartesian(x, y, r, end);
    const endPoint = polarToCartesian(x, y, r, start);
    const largeArcFlag = end - start <= 180 ? "0" : "1";

    return [
      `M ${x} ${y}`,
      `L ${startPoint.x} ${startPoint.y}`,
      `A ${r} ${r} 0 ${largeArcFlag} 0 ${endPoint.x} ${endPoint.y}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className="pie-chart-wrap">
      <svg viewBox="0 0 240 240" className="pie-chart-svg">
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const endAngle = startAngle + angle;
          const path = describeArc(cx, cy, radius, startAngle, endAngle);
          const segment = (
            <path
              key={item.label}
              d={path}
              fill={getTypeColor(index)}
              stroke="#d8e8ff"
              strokeWidth="2"
            />
          );
          startAngle = endAngle;
          return segment;
        })}
      </svg>

      <div className="pie-chart-legend">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div className="pie-legend-item" key={item.label}>
              <span
                className="pie-legend-dot"
                style={{ backgroundColor: getTypeColor(index) }}
              ></span>
              <span className="pie-legend-label">
                {item.label} {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChartSvg({ data }) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.incoming, item.outgoing])
  );

  const chartHeight = 220;
  const chartBottom = 250;
  const baseY = chartBottom;
  const barWidth = 34;
  const groupGap = 58;
  const startX = 58;

  return (
    <svg viewBox="0 0 360 280" className="bar-chart-svg">
      {[0, 5, 10, 15, 20].map((tick, index) => {
        const y = baseY - (tick / 20) * 180;
        return (
          <g key={tick}>
            <line x1="42" y1={y} x2="330" y2={y} className="bar-grid-line" />
            <text x="20" y={y + 4} className="bar-axis-text">
              {tick}
            </text>
          </g>
        );
      })}

      <line x1="42" y1="40" x2="42" y2={baseY} className="bar-axis-line" />
      <line x1="42" y1={baseY} x2="330" y2={baseY} className="bar-axis-line" />

      {data.map((item, index) => {
        const groupX = startX + index * groupGap;
        const incomingHeight = (item.incoming / maxValue) * chartHeight;
        const outgoingHeight = (item.outgoing / maxValue) * chartHeight;

        return (
          <g key={item.label}>
            <rect
              x={groupX}
              y={baseY - outgoingHeight}
              width={barWidth}
              height={outgoingHeight}
              fill="#5d7cff"
              rx="4"
            />
            <rect
              x={groupX + barWidth + 4}
              y={baseY - incomingHeight}
              width={barWidth}
              height={incomingHeight}
              fill="#ef66b8"
              rx="4"
            />
            <text x={groupX + 24} y="270" className="bar-axis-text month">
              {item.label}
            </text>
          </g>
        );
      })}

      <circle cx="105" cy="22" r="5" fill="#5d7cff" />
      <text x="116" y="26" className="bar-legend-text">
        OUTGOING
      </text>

      <circle cx="200" cy="22" r="5" fill="#ef66b8" />
      <text x="211" y="26" className="bar-legend-text">
        INCOMING
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setDocuments(rows);
    });

    return () => unsub();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return documents;

    return documents.filter((doc) => {
      return (
        String(doc.refNo || "").toLowerCase().includes(keyword) ||
        String(doc.title || "").toLowerCase().includes(keyword) ||
        String(doc.type || "").toLowerCase().includes(keyword) ||
        String(doc.department || "").toLowerCase().includes(keyword)
      );
    });
  }, [documents, search]);

  const summary = useMemo(() => {
    const incomingCount = filteredDocuments.filter(
      (d) => String(d.direction || "").toLowerCase() === "incoming"
    ).length;

    const outgoingCount = filteredDocuments.filter(
      (d) => String(d.direction || "").toLowerCase() === "outgoing"
    ).length;

    const totalCount = filteredDocuments.length;

    const typeMap = {};
    filteredDocuments.forEach((doc) => {
      const type = String(doc.type || "OTHER").toUpperCase();
      typeMap[type] = (typeMap[type] || 0) + 1;
    });

    const pieData = Object.entries(typeMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const months = buildLast3Months();

    filteredDocuments.forEach((doc) => {
      const d = safeDate(doc.createdAt);
      if (!d) return;

      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const found = months.find((m) => m.key === key);
      if (!found) return;

      const direction = String(doc.direction || "").toLowerCase();
      if (direction === "incoming") found.incoming += 1;
      if (direction === "outgoing") found.outgoing += 1;
    });

    const latestRefs = filteredDocuments
      .filter((d) => d.refNo)
      .slice(0, 4)
      .map((d) => d.refNo);

    return {
      incomingCount,
      outgoingCount,
      totalCount,
      pieData,
      monthlyData: months,
      latestRefs,
    };
  }, [filteredDocuments]);

  return (
    <Layout title="">
      <div className="dashboard-screen">
        <div className="dashboard-top-row">
          <h1 className="dashboard-main-title">Dashboard</h1>

          <div className="dashboard-search-wrap">
            <input
              className="dashboard-search-input"
              placeholder="search data"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="dashboard-search-icon">⌕</span>
          </div>
        </div>

        <div className="dashboard-content-grid">
          <div className="dashboard-chart-panel">
            <div className="dashboard-charts-inner">
              <div className="dashboard-bar-box">
                <BarChartSvg data={summary.monthlyData} />
              </div>

              <div className="dashboard-pie-box">
                <PieChartSvg data={summary.pieData} />
              </div>
            </div>
          </div>

          <div className="dashboard-ref-panel">
            <div className="dashboard-ref-title">REFERENCE NO</div>
            <div className="dashboard-ref-list">
              {summary.latestRefs.length === 0 ? (
                <div className="dashboard-ref-empty">No data</div>
              ) : (
                summary.latestRefs.map((ref) => (
                  <div className="dashboard-ref-item" key={ref}>
                    {ref}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-cards-row">
          <div className="summary-card incoming">
            <div className="summary-card-label">Incoming</div>
            <div className="summary-card-value">{summary.incomingCount}</div>
          </div>

          <div className="summary-card outgoing">
            <div className="summary-card-label">Outgoing</div>
            <div className="summary-card-value">{summary.outgoingCount}</div>
          </div>

          <div className="summary-card total">
            <div className="summary-card-label">Total</div>
            <div className="summary-card-value">{summary.totalCount}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
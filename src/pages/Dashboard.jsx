import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { db } from "../firebase";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TYPE_COLORS = {
  Memo: "#2f80ed",
  Surat: "#e55353",
  Utusan: "#4caf50",
  Email: "#f2a93b",
};

function safeDate(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3H14L19 8V21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3V8H19" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 13H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C4.5 7.5 8 5 12 5C16 5 19.5 7.5 22 12C19.5 16.5 16 19 12 19C8 19 4.5 16.5 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ProcessedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 12L11 15L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function UploadActivityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 17V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 9L12 5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ViewedActivityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C4.5 7.5 8 5 12 5C16 5 19.5 7.5 22 12C19.5 16.5 16 19 12 19C8 19 4.5 16.5 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ProcessedActivityIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 12.5L10.2 15.5L17 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefUserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20C5 16.7 8.1 14 12 14C15.9 14 19 16.7 19 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6L18 18M6 18L18 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ====== Clickable Stat Card ====== */
function StatCard({ colorClass, icon, label, value, onClick }) {
  return (
    <div
      className={`dashboard-stat-card ${colorClass} dashboard-stat-clickable`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="dashboard-stat-top">
        <div className="dashboard-stat-icon">{icon}</div>
        <div className="dashboard-stat-label">{label}</div>
      </div>
      <div className="dashboard-stat-value">{value}</div>
    </div>
  );
}

/* ====== Modal for file list ====== */
function FileListModal({ title, iconColor, icon, items, onClose }) {
  return (
    <div
      className="dashboard-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="dashboard-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-title-wrap">
            <span
              className="dashboard-modal-title-icon"
              style={{ background: iconColor }}
            >
              {icon}
            </span>
            <h3 className="dashboard-modal-title">{title}</h3>
          </div>
          <button
            type="button"
            className="dashboard-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="dashboard-modal-body">
          <div className="dashboard-modal-subtitle">List of {title}</div>

          {items.length === 0 ? (
            <div className="dashboard-modal-empty">No files to display</div>
          ) : (
            <table className="dashboard-modal-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Reference Number</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={item.fileUrl ? "dashboard-modal-row-clickable" : ""}
                    onClick={() => {
                      if (item.fileUrl) {
                        window.open(item.fileUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{item.refNo || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dashboard-modal-footer">
          <button
            type="button"
            className="dashboard-modal-close-action"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeType(type) {
  const value = String(type || "").toLowerCase();

  if (value.includes("memo")) return "Memo";
  if (value.includes("surat") || value.includes("letter")) return "Surat";
  if (value.includes("utusan")) return "Utusan";
  if (value.includes("email") || value.includes("mail")) return "Email";

  return "Memo";
}

function PieChartSvg({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return <div className="dashboard-empty-chart">No type data</div>;
  }

  const orderedData = ["Memo", "Surat", "Utusan", "Email"]
    .map((label) => data.find((item) => item.label === label))
    .filter(Boolean);

  const radius = 78;
  const cx = 120;
  const cy = 95;
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
    <div className="pie-chart-wrap clean-pie-wrap">
      <svg viewBox="0 0 240 240" className="pie-chart-svg dashboard-equal-chart">
        {orderedData.map((item) => {
          const angle = (item.value / total) * 360;
          const endAngle = startAngle + angle;
          const path = describeArc(cx, cy, radius, startAngle, endAngle);

          const midAngle = startAngle + angle / 2;
          const textPoint = polarToCartesian(cx, cy, radius * 0.58, midAngle);
          const percentage = Math.round((item.value / total) * 100);

          const segment = (
            <g key={item.label}>
              <path
                d={path}
                fill={TYPE_COLORS[item.label] || "#9ca3af"}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={textPoint.x}
                y={textPoint.y - 4}
                textAnchor="middle"
                className="pie-slice-label"
              >
                {item.label}
              </text>
              <text
                x={textPoint.x}
                y={textPoint.y + 12}
                textAnchor="middle"
                className="pie-slice-value"
              >
                {percentage}%
              </text>
            </g>
          );

          startAngle = endAngle;
          return segment;
        })}
      </svg>

      <div className="pie-chart-legend clean-pie-legend dashboard-equal-legend">
        {orderedData.map((item) => (
          <div className="pie-legend-item" key={item.label}>
            <span
              className="pie-legend-dot"
              style={{ backgroundColor: TYPE_COLORS[item.label] }}
            ></span>
            <span className="pie-legend-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChartSvg({ data }) {
  const orderedData = MONTHS.map((month) => {
    const found = data.find((item) => item.label === month);
    return (
      found || {
        label: month,
        memo: 0,
        surat: 0,
        utusan: 0,
        email: 0,
      }
    );
  });

  const maxValue = Math.max(
    10,
    ...orderedData.flatMap((item) => [item.memo, item.surat, item.utusan, item.email])
  );

  const niceMax = Math.ceil(maxValue / 5) * 5;
  const ticks = Array.from({ length: niceMax / 5 + 1 }, (_, i) => i * 5);

  const chartHeight = 150;
  const baseY = 182;
  const leftX = 30;
  const rightX = 410;
  const chartStartX = 20;
  const groupGap = 30.5;
  const barWidth = 7;

  return (
    <svg viewBox="0 0 430 240" className="bar-chart-svg dashboard-equal-chart">
      <text x="10" y="18" className="bar-y-title">
        Bilangan
      </text>

      {ticks.map((tick) => {
        const y = baseY - (tick / niceMax) * chartHeight;
        return (
          <g key={tick}>
            <line
              x1={leftX}
              y1={y}
              x2={rightX}
              y2={y}
              className={tick === 0 ? "bar-axis-line" : "bar-grid-line light"}
            />
            <text x="12" y={y + 4} className="bar-axis-text">
              {tick}
            </text>
          </g>
        );
      })}

      <line x1={leftX} y1="28" x2={leftX} y2={baseY} className="bar-axis-line" />
      <line x1={leftX} y1={baseY} x2={rightX} y2={baseY} className="bar-axis-line" />

      {orderedData.map((item, index) => {
        const groupX = chartStartX + index * groupGap;

        return (
          <g key={item.label}>
            <rect
              x={groupX}
              y={baseY - (item.memo / niceMax) * chartHeight}
              width={barWidth}
              height={(item.memo / niceMax) * chartHeight}
              fill={TYPE_COLORS.Memo}
              rx="2"
            />
            <rect
              x={groupX + 8}
              y={baseY - (item.surat / niceMax) * chartHeight}
              width={barWidth}
              height={(item.surat / niceMax) * chartHeight}
              fill={TYPE_COLORS.Surat}
              rx="2"
            />
            <rect
              x={groupX + 16}
              y={baseY - (item.utusan / niceMax) * chartHeight}
              width={barWidth}
              height={(item.utusan / niceMax) * chartHeight}
              fill={TYPE_COLORS.Utusan}
              rx="2"
            />
            <rect
              x={groupX + 24}
              y={baseY - (item.email / niceMax) * chartHeight}
              width={barWidth}
              height={(item.email / niceMax) * chartHeight}
              fill={TYPE_COLORS.Email}
              rx="2"
            />

            <text x={groupX + 12} y="202" className="bar-axis-text month">
              {item.label}
            </text>
          </g>
        );
      })}

      <g>
        <rect x="80" y="218" width="10" height="10" rx="2" fill={TYPE_COLORS.Memo} />
        <text x="95" y="227" className="bar-legend-text">Memo</text>

        <rect x="150" y="218" width="10" height="10" rx="2" fill={TYPE_COLORS.Surat} />
        <text x="165" y="227" className="bar-legend-text">Surat</text>

        <rect x="225" y="218" width="10" height="10" rx="2" fill={TYPE_COLORS.Utusan} />
        <text x="240" y="227" className="bar-legend-text">Utusan</text>

        <rect x="315" y="218" width="10" height="10" rx="2" fill={TYPE_COLORS.Email} />
        <text x="330" y="227" className="bar-legend-text">Email</text>
      </g>
    </svg>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "viewed" | "processed" | "total" | null
  const navigate = useNavigate();

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeModal]);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return documents;

    return documents.filter((doc) => {
      return (
        String(doc.refNo || "").toLowerCase().includes(keyword) ||
        String(doc.title || "").toLowerCase().includes(keyword) ||
        String(doc.type || "").toLowerCase().includes(keyword) ||
        String(doc.department || "").toLowerCase().includes(keyword) ||
        String(doc.status || "").toLowerCase().includes(keyword)
      );
    });
  }, [documents, search]);

  const summary = useMemo(() => {
    const totalCount = filteredDocuments.length;

    const pendingDocs = filteredDocuments.filter(
      (d) => !d.status || String(d.status).toLowerCase() === "pending"
    );

    const viewedDocs = filteredDocuments.filter(
      (d) =>
        String(d.status || "").toLowerCase() === "viewed" ||
        d.viewed === true
    );

    const processedDocs = filteredDocuments.filter(
      (d) => String(d.status || "").toLowerCase() === "processed"
    );

    const months = MONTHS.map((month) => ({
      label: month,
      memo: 0,
      surat: 0,
      utusan: 0,
      email: 0,
    }));

    filteredDocuments.forEach((doc) => {
      const d = safeDate(doc.createdAt);
      if (!d) return;

      const monthIndex = d.getMonth();
      const found = months[monthIndex];
      if (!found) return;

      const typeLabel = normalizeType(doc.type);
      if (typeLabel === "Memo") found.memo += 1;
      if (typeLabel === "Surat") found.surat += 1;
      if (typeLabel === "Utusan") found.utusan += 1;
      if (typeLabel === "Email") found.email += 1;
    });

    const typeTotals = {
      Memo: 0,
      Surat: 0,
      Utusan: 0,
      Email: 0,
    };

    filteredDocuments.forEach((doc) => {
      const label = normalizeType(doc.type);
      typeTotals[label] += 1;
    });

    const pieData = Object.entries(typeTotals)
      .map(([label, value]) => ({ label, value }))
      .filter((item) => item.value > 0);

    const recentActivity = filteredDocuments.map((doc, index) => {
      const status = String(doc.status || "").toLowerCase();

      if (status === "processed") {
        return {
          id: doc.id || index,
          iconType: "processed",
          text: `File ${doc.refNo || doc.title || "N/A"} processed`,
        };
      }

      if (status === "viewed" || doc.viewed === true) {
        return {
          id: doc.id || index,
          iconType: "viewed",
          text: `File ${doc.refNo || doc.title || "N/A"} viewed`,
        };
      }

      return {
        id: doc.id || index,
        iconType: "uploaded",
        text: `File ${doc.refNo || doc.title || "N/A"} uploaded`,
      };
    });

    const allRefs = filteredDocuments
      .filter((d) => d.refNo)
      .map((d) => ({
        id: d.id,
        refNo: d.refNo,
        fileUrl: d.fileUrl || "",
      }));

    return {
      totalCount,
      pendingCount: pendingDocs.length,
      viewedCount: viewedDocs.length,
      processedCount: processedDocs.length,
      viewedDocs,
      processedDocs,
      allDocs: filteredDocuments,
      monthlyData: months,
      pieData,
      recentActivity,
      allRefs,
    };
  }, [filteredDocuments]);

  // Card click handlers
  const handlePendingClick = () => {
    navigate("/library?status=pending");
  };

  const handleViewedClick = () => {
    setActiveModal("viewed");
  };

  const handleProcessedClick = () => {
    setActiveModal("processed");
  };

  const handleTotalClick = () => {
    setActiveModal("total");
  };

  // Build modal items based on active modal
  const getModalData = () => {
    if (activeModal === "viewed") {
      return {
        title: "Viewed Files",
        iconColor: "#27ae60",
        icon: <ViewIcon />,
        items: summary.viewedDocs.map((d) => ({
          id: d.id,
          refNo: d.refNo,
          fileUrl: d.fileUrl || "",
        })),
      };
    }
    if (activeModal === "processed") {
      return {
        title: "Processed Files",
        iconColor: "#8e44ad",
        icon: <ProcessedIcon />,
        items: summary.processedDocs.map((d) => ({
          id: d.id,
          refNo: d.refNo,
          fileUrl: d.fileUrl || "",
        })),
      };
    }
    if (activeModal === "total") {
      return {
        title: "All Documents",
        iconColor: "#2f80ed",
        icon: <FileIcon />,
        items: summary.allDocs.map((d) => ({
          id: d.id,
          refNo: d.refNo,
          fileUrl: d.fileUrl || "",
        })),
      };
    }
    return null;
  };

  const modalData = getModalData();

  return (
    <Layout>
      <div className="dashboard-screen dashboard-fixed-layout">
        <div className="dashboard-top-row">
          <h1 className="dashboard-main-title">Dashboard</h1>
          <div className="dashboard-search-wrap">
            <input
              className="dashboard-search-input"
              placeholder="Search data"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="dashboard-search-icon">
              <SearchIcon />
            </span>
          </div>
        </div>

        <div className="dashboard-cards-grid">
          <StatCard
            colorClass="orange"
            icon={<PendingIcon />}
            label="Pending Files"
            value={summary.pendingCount}
            onClick={handlePendingClick}
          />
          <StatCard
            colorClass="green"
            icon={<ViewIcon />}
            label="Viewed Files"
            value={summary.viewedCount}
            onClick={handleViewedClick}
          />
          <StatCard
            colorClass="purple"
            icon={<ProcessedIcon />}
            label="Processed Files"
            value={summary.processedCount}
            onClick={handleProcessedClick}
          />
          <StatCard
            colorClass="blue"
            icon={<FileIcon />}
            label="Total Documents"
            value={summary.totalCount}
            onClick={handleTotalClick}
          />
        </div>

        <div className="dashboard-chart-grid">
          <div className="dashboard-chart-box">
            <h3 className="dashboard-section-title">Monthly Document Overview</h3>
            <div className="dashboard-bar-box">
              <BarChartSvg data={summary.monthlyData} />
            </div>
          </div>

          <div className="dashboard-chart-box">
            <h3 className="dashboard-section-title">Document Distribution</h3>
            <div className="dashboard-pie-box">
              <PieChartSvg data={summary.pieData} />
            </div>
          </div>
        </div>

        <div className="dashboard-bottom-grid">
          <div className="dashboard-list-panel">
            <h3 className="dashboard-section-title">Recent Activity</h3>

            <div className="dashboard-activity-list">
              {summary.recentActivity.length === 0 ? (
                <div className="dashboard-empty-text">No recent activity</div>
              ) : (
                summary.recentActivity.map((item) => (
                  <div className="dashboard-activity-item" key={item.id}>
                    <span
                      className={`dashboard-activity-icon ${
                        item.iconType === "processed"
                          ? "icon-green"
                          : item.iconType === "viewed"
                          ? "icon-blue"
                          : "icon-sky"
                      }`}
                    >
                      {item.iconType === "processed" ? (
                        <ProcessedActivityIcon />
                      ) : item.iconType === "viewed" ? (
                        <ViewedActivityIcon />
                      ) : (
                        <UploadActivityIcon />
                      )}
                    </span>

                    <span className="dashboard-activity-text">{item.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-list-panel">
            <h3 className="dashboard-section-title">Reference Numbers</h3>

            <div className="dashboard-ref-list">
              {summary.allRefs.length === 0 ? (
                <div className="dashboard-ref-empty">No data</div>
              ) : (
                summary.allRefs.map((item, index) => {
                  const content = (
                    <>
                      <span
                        className={`dashboard-ref-icon ${
                          index % 4 === 0
                            ? "icon-gray"
                            : index % 4 === 1
                            ? "icon-blue"
                            : index % 4 === 2
                            ? "icon-green"
                            : "icon-red"
                        }`}
                      >
                        <RefUserIcon />
                      </span>

                      <span className="dashboard-ref-text">
                        <strong>{item.refNo}</strong>
                      </span>
                    </>
                  );

                  return item.fileUrl ? (
                    <a
                      key={`${item.id}-${item.refNo}`}
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dashboard-ref-item dashboard-ref-link"
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      className="dashboard-ref-item"
                      key={`${item.id}-${item.refNo}`}
                    >
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Viewed / Processed / Total cards */}
      {modalData && (
        <FileListModal
          title={modalData.title}
          iconColor={modalData.iconColor}
          icon={modalData.icon}
          items={modalData.items}
          onClose={() => setActiveModal(null)}
        />
      )}
    </Layout>
  );
}
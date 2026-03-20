import { useEffect, useState } from "react";

interface Props { log: string[] }

function getEntryBorderColor(entry: string): string {
  const lower = entry.toLowerCase();
  if (lower.includes("evolved") || lower.includes("ascend")) return "#fbbf24";
  if (lower.includes("corrupt") || lower.includes("critical")) return "#ff4040";
  if (lower.includes("recovered") || lower.includes("defrag")) return "#22d3a0";
  if (lower.includes("hibernate") || lower.includes("sleep")) return "#4060a0";
  return "#1a2240";
}


export default function LifeLog({ log }: Props) {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const scrollbarStyles = `
    .lifelog-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .lifelog-scroll::-webkit-scrollbar-track {
      background: #050a14;
    }
    .lifelog-scroll::-webkit-scrollbar-thumb {
      background: #1a2a40;
      border-radius: 2px;
    }
    .lifelog-scroll::-webkit-scrollbar-thumb:hover {
      background: #2a3f60;
    }
    @media (max-width: 600px) {
      .lifelog-scroll {
        max-height: 180px !important;
      }
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          background: "#070d1a",
          border: "1px solid #1a2a40",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "#0a1220",
            borderBottom: "1px solid #1a2a40",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#8ab4c8",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span>◈ SYSTEM LOG</span>
            <span
              style={{
                color: "#4a9090",
                opacity: cursorVisible ? 1 : 0,
                transition: "opacity 0.05s",
                lineHeight: 1,
              }}
            >
              ▋
            </span>
          </div>
          <div
            style={{
              background: "#0f1e30",
              border: "1px solid #1e3550",
              borderRadius: "10px",
              padding: "2px 8px",
              fontSize: "10px",
              color: "#4a9090",
              letterSpacing: "0.05em",
            }}
          >
            {log.length} {log.length === 1 ? "entry" : "entries"}
          </div>
        </div>

        {/* Log entries */}
        <div
          className="lifelog-scroll"
          style={{
            maxHeight: "240px",
            overflowY: "auto",
            padding: "6px 0",
          }}
        >
          {log.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#2a3f5a",
                fontSize: "11px",
                letterSpacing: "0.08em",
                padding: "28px 12px",
              }}
            >
              // NO EVENTS RECORDED
            </div>
          ) : (
            log.map((entry, i) => {
              const isLatest = i === 0;
              const borderColor = getEntryBorderColor(entry);
              // Entries from reducer already include a "[HH:MM] " prefix — display as-is
              const text = entry;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "8px",
                    padding: "4px 12px 4px 10px",
                    borderLeft: `3px solid ${borderColor}`,
                    marginLeft: "6px",
                    marginBottom: "2px",
                    background: isLatest
                      ? "rgba(74, 144, 144, 0.06)"
                      : "transparent",
                    borderRadius: "0 3px 3px 0",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      color: isLatest ? "#b8cfe0" : "#607080",
                      fontSize: "11px",
                      lineHeight: "1.4",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {text}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

interface Props { log: string[] }

export default function LifeLog({ log }: Props) {
  return (
    <div className="life-log">
      <div className="log-title">◈ SYSTEM LOG</div>
      <div className="log-entries">
        {log.map((entry, i) => (
          <div key={i} className="log-entry" style={{ opacity: 1 - i * 0.04 }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}

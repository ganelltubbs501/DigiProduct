export function Cover({ title, tagline, hue, kind }: { title: string; tagline?: string; hue: number; kind?: string }) {
  return (
    <div className="cover-wrap">
      <div className="cover" style={{ background: `linear-gradient(150deg, hsl(${hue} 70% 45%), hsl(${(hue + 40) % 360} 65% 28%))` }}>
        {kind && <div style={{ fontSize: "max(0.55rem, 5cqw)", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85, marginBottom: "auto" }}>{kind}</div>}
        {title}
        {tagline && <small>{tagline}</small>}
      </div>
    </div>
  );
}

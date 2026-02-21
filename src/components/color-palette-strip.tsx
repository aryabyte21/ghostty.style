interface ColorPaletteStripProps {
  palette: string[];
  className?: string;
}

export default function ColorPaletteStrip({
  palette,
  className,
}: ColorPaletteStripProps) {
  return (
    <div className={`flex rounded overflow-hidden ${className ?? ""}`} role="img" aria-label="Color palette">
      {palette.map((color, i) => (
        <div
          key={i}
          className="h-6 flex-1"
          style={{ backgroundColor: color }}
          title={`palette[${i}]: ${color}`}
        />
      ))}
    </div>
  );
}

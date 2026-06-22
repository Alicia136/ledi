interface LediLogoProps {
  size?: number;
}

export default function LediLogo({ size = 24 }: LediLogoProps) {
  const pinW = Math.round(size * 0.38);
  const pinH = Math.round(size * 0.5);

  return (
    <span
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: size,
        fontWeight: 700,
        color: "white",
        letterSpacing: "-0.01em",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "baseline",
        userSelect: "none",
      }}
    >
      Led
      <span style={{ position: "relative", display: "inline-block" }}>
        {/* dotless i */}
        ı
        {/* turquoise location pin replacing the dot */}
        <svg
          width={pinW}
          height={pinH}
          viewBox="0 0 10 13"
          fill="none"
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "1px",
            display: "block",
          }}
        >
          <path
            d="M5 0C2.79 0 1 1.79 1 4c0 2.5 4 9 4 9s4-6.5 4-9c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fill="#00B4D8"
          />
        </svg>
      </span>
    </span>
  );
}

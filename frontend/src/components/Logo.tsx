import React from "react";

type Props = {
  width?: number;
  height?: number;
  alt?: string;
};

// Placeholder "Fresh Petals" brand mark — a self-contained SVG wordmark in the
// site's olive-green / light-brown palette. Generated stand-in for the real
// logo design (replaces the old "Artisan Flowers" placeholder image). Swap the
// markup here — or point this back at an <Image> — once a final logo lands.
const Logo: React.FC<Props> = ({ width = 140, height = 36, alt = "Fresh Petals India" }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 56"
      role="img"
      aria-label={alt}
      preserveAspectRatio="xMinYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flower mark */}
      <g transform="translate(6 4)">
        {/* stem */}
        <path d="M22 48 L22 22" stroke="#7C835A" strokeWidth="2.2" strokeLinecap="round" />
        {/* leaves */}
        <path d="M22 38 C13 36 9 40 8 46 C16 46 21 43 22 38 Z" fill="#7C835A" opacity="0.85" />
        <path d="M22 33 C31 31 35 35 36 41 C28 41 23 38 22 33 Z" fill="#7C835A" opacity="0.85" />
        {/* petals */}
        <g fill="#B79B7A">
          <ellipse cx="22" cy="6" rx="4.3" ry="7.6" />
          <ellipse cx="22" cy="6" rx="4.3" ry="7.6" transform="rotate(72 22 13)" />
          <ellipse cx="22" cy="6" rx="4.3" ry="7.6" transform="rotate(144 22 13)" />
          <ellipse cx="22" cy="6" rx="4.3" ry="7.6" transform="rotate(216 22 13)" />
          <ellipse cx="22" cy="6" rx="4.3" ry="7.6" transform="rotate(288 22 13)" />
        </g>
        {/* flower centre */}
        <circle cx="22" cy="13" r="3.8" fill="#7C835A" />
      </g>

      {/* Wordmark */}
      <text
        x="58"
        y="35"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="25"
        fontWeight="600"
        letterSpacing="0.4"
        fill="#7C835A"
      >
        Fresh
        <tspan fill="#B79B7A"> Petals</tspan>
      </text>
    </svg>
  );
};

export default Logo;

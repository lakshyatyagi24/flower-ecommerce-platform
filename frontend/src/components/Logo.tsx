import React from "react";
import Image from "next/image";
import logoSrc from "../assets/logo.png";

type Props = {
  width?: number;
  height?: number;
  alt?: string;
};

const Logo: React.FC<Props> = ({ width = 140, height = 36, alt = "Flower Shop" }) => {
  return (
    <div className="flex items-center">
      <Image src={logoSrc} alt={alt} width={width} height={height} priority />
    </div>
  );
};

export default Logo;

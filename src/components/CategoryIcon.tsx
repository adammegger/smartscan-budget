import React from "react";
import { iconMap } from "../lib/categories";

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

export default function CategoryIcon({
  icon,
  color,
  size = 16,
  className = "",
}: CategoryIconProps) {
  const IconComponent = iconMap[icon] || iconMap["MoreHorizontal"];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      style={color ? { color } : undefined}
    />
  );
}

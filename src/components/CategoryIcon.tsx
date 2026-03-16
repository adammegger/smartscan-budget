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
  // Handle empty or invalid icon names
  const safeIcon = icon && icon.trim() ? icon : "MoreHorizontal";

  const IconComponent = iconMap[safeIcon] || iconMap["MoreHorizontal"];

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

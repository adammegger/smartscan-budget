import React from "react";
import { Button } from "./ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MobileTimeFilterProps {
  timeFilter: "today" | "week" | "month" | "year" | "all";
  onTimeFilterChange: (
    filter: "today" | "week" | "month" | "year" | "all",
  ) => void;
}

const filterOptions = [
  { key: "all" as const, label: "Wszystko" },
  { key: "today" as const, label: "Dzisiaj" },
  { key: "week" as const, label: "Ostatnie 7 dni" },
  { key: "month" as const, label: "Ten miesiąc" },
  { key: "year" as const, label: "Ten rok" },
];

export default function MobileTimeFilter({
  timeFilter,
  onTimeFilterChange,
}: MobileTimeFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Find the label for the currently selected filter
  const currentFilterLabel =
    filterOptions.find((f) => f.key === timeFilter)?.label || "Filtruj";

  const handleSelectOption = (
    filterKey: MobileTimeFilterProps["timeFilter"],
  ) => {
    onTimeFilterChange(filterKey);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="h-9 w-full justify-between items-center bg-card border-border/50 hover:bg-muted transition-colors text-sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span className="text-foreground font-medium">
          Filtr: {currentFilterLabel}
        </span>
        {isDropdownOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
          {filterOptions.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleSelectOption(filter.key)}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                timeFilter === filter.key
                  ? "bg-orange-500/10 text-orange-500 border-l-2 border-orange-500"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

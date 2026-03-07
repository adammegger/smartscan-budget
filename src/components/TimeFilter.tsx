import { Button } from "./ui/button";

interface TimeFilterProps {
  timeFilter: "today" | "week" | "month" | "year" | "all";
  onTimeFilterChange: (
    filter: "today" | "week" | "month" | "year" | "all",
  ) => void;
}

export default function TimeFilter({
  timeFilter,
  onTimeFilterChange,
}: TimeFilterProps) {
  return (
    <div className="flex gap-2">
      {[
        { key: "today" as const, label: "Dzisiaj" },
        { key: "week" as const, label: "Ostatnie 7 dni" },
        { key: "month" as const, label: "Ten miesiąc" },
        { key: "year" as const, label: "Ten rok" },
        { key: "all" as const, label: "Wszystko" },
      ].map((filter) => (
        <Button
          key={filter.key}
          variant={timeFilter === filter.key ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeFilterChange(filter.key)}
          className={`cursor-pointer ${
            timeFilter === filter.key
              ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              : ""
          }`}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

interface Category {
  id: string;
  name: string;
}

interface CategoryDropdownProps {
  value: string;
  categories: Category[];
  onChange: (selectedId: string) => void;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  categories,
  onChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Find the label for the currently selected category
  const currentCategoryLabel =
    categories.find((c) => c.id === value)?.name || "Wybierz...";

  const handleSelectOption = (selectedId: string) => {
    onChange(selectedId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="h-9 w-full justify-between items-center bg-card border-border/50 hover:bg-muted transition-colors text-sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span className="text-foreground font-medium">
          {currentCategoryLabel}
        </span>
        {isDropdownOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-[100] animate-in fade-in-0 zoom-in-95 duration-200 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelectOption(category.id)}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                value === category.id
                  ? "bg-orange-500/10 text-orange-500 border-l-2 border-orange-500"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;

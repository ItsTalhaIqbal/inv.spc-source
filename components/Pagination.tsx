import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const { theme } = useTheme();
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 5;

  if (totalPages <= 1 || totalItems === 0) {
    return null;
  }

  const getPageNumbers = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    start = Math.max(1, end - maxVisiblePages + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4 mb-4 p-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`${
          theme === "dark"
            ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            : "bg-white text-black border-gray-300 hover:bg-gray-100"
        } disabled:opacity-50`}
      >
        Previous
      </Button>

      {getPageNumbers().map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={`${
            currentPage === page
              ? theme === "dark"
                ? "bg-white text-black"
                : "bg-black text-white"
              : theme === "dark"
              ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
              : "bg-white text-black border-gray-300 hover:bg-gray-100"
          }`}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`${
          theme === "dark"
            ? "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            : "bg-white text-black border-gray-300 hover:bg-gray-100"
        } disabled:opacity-50`}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
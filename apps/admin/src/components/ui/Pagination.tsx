import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 sm:px-6 mt-4 rounded-md">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing page <span className="font-medium text-[var(--color-text)]">{page}</span> of{" "}
            <span className="font-medium text-[var(--color-text)]">{totalPages}</span>
            {total !== undefined && (
              <>
                {" "}
                (<span className="font-medium text-[var(--color-text)]">{total}</span> total results)
              </>
            )}
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              className="rounded-l-md rounded-r-none border-r-0 px-2 py-2"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            
            {/* Show page numbers - simple version for now (just previous, current, next if available) */}
            {page > 2 && (
              <>
                <Button variant="outline" size="sm" className="rounded-none border-r-0" onClick={() => onPageChange(1)}>
                  1
                </Button>
                {page > 3 && <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>}
              </>
            )}

            {page > 1 && (
              <Button variant="outline" size="sm" className="rounded-none border-r-0" onClick={() => onPageChange(page - 1)}>
                {page - 1}
              </Button>
            )}

            <Button variant="primary" size="sm" className="rounded-none border-r-0">
              {page}
            </Button>

            {page < totalPages && (
              <Button variant="outline" size="sm" className="rounded-none border-r-0" onClick={() => onPageChange(page + 1)}>
                {page + 1}
              </Button>
            )}

            {page < totalPages - 1 && (
              <>
                {page < totalPages - 2 && <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>}
                <Button variant="outline" size="sm" className="rounded-none border-r-0" onClick={() => onPageChange(totalPages)}>
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-r-md rounded-l-none px-2 py-2"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}

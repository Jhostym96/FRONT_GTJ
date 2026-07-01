import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Tooltip } from "./ui/Accessibility";

const getPageItems = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (page >= totalPages - 2) {
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  const sortedPages = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.flatMap((item, index) => {
    const previous = sortedPages[index - 1];
    if (previous && item - previous > 1) {
      return [`ellipsis-${previous}-${item}`, item];
    }

    return [item];
  });
};

function TablePagination({
  page = 1,
  totalPages = 0,
  total = 0,
  limit = 10,
  onPageChange,
}) {
  const [pageInput, setPageInput] = useState("");
  const safePage = Number(page) || 1;
  const safeTotalPages = Number(totalPages) || 0;
  const safeTotal = Number(total) || 0;
  const safeLimit = Number(limit) || 10;
  const from = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const to = Math.min(safePage * safeLimit, safeTotal);
  const pageItems = useMemo(
    () => getPageItems(safePage, safeTotalPages),
    [safePage, safeTotalPages]
  );

  const goToPage = (nextPage) => {
    if (!onPageChange) return;
    if (nextPage < 1 || nextPage > safeTotalPages || nextPage === safePage) {
      return;
    }

    onPageChange(nextPage);
  };

  const handleJumpSubmit = (event) => {
    event.preventDefault();

    const nextPage = Number(pageInput);
    if (!Number.isInteger(nextPage)) return;

    goToPage(nextPage);
    setPageInput("");
  };

  return (
    <div className="pagination-bar">
      <p className="text-muted text-sm">
        {safeTotal === 0
          ? "Sin registros"
          : `Mostrando ${from}-${to} de ${safeTotal}`}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
        <Tooltip label="Página anterior" position="top">
          {(tooltipProps) => (
            <button
              type="button"
              className="btn-secondary btn-icon"
              disabled={safePage <= 1}
              onClick={() => goToPage(safePage - 1)}
              aria-label="Página anterior"
              {...tooltipProps}
            >
              <ChevronLeft />
            </button>
          )}
        </Tooltip>

          {pageItems.map((item) =>
            typeof item === "number" ? (
              <button
                key={item}
                type="button"
                className={
                  item === safePage
                    ? "pagination-page bg-[var(--app-primary)] text-white"
                    : "pagination-page transition hover:border-[var(--app-primary)]"
                }
                onClick={() => goToPage(item)}
                aria-current={item === safePage ? "page" : undefined}
              >
                {item}
              </button>
            ) : (
              <span
                key={item}
                className="pagination-page min-w-10 justify-center px-2"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )
          )}

        <Tooltip label="Página siguiente" position="top">
          {(tooltipProps) => (
            <button
              type="button"
              className="btn-secondary btn-icon"
              disabled={safeTotalPages === 0 || safePage >= safeTotalPages}
              onClick={() => goToPage(safePage + 1)}
              aria-label="Página siguiente"
              {...tooltipProps}
            >
              <ChevronRight />
            </button>
          )}
        </Tooltip>
        </div>

        {safeTotalPages > 7 && (
          <form
            onSubmit={handleJumpSubmit}
            className="flex items-center gap-2 sm:ml-2"
          >
            <label className="text-faint whitespace-nowrap text-xs font-bold">
              Ir a
            </label>
            <input
              type="number"
              min="1"
              max={safeTotalPages || 1}
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              className="input h-10 w-20 px-2 text-center text-sm"
              placeholder={String(safePage)}
              aria-label="Ir a página"
            />
            <button type="submit" className="btn-secondary h-10 px-3 text-xs">
              Ir
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default TablePagination;

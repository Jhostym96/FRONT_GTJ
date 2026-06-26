import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip } from "./ui/Accessibility";

function TablePagination({
  page = 1,
  totalPages = 0,
  total = 0,
  limit = 10,
  onPageChange,
}) {
  const safePage = Number(page) || 1;
  const safeTotalPages = Number(totalPages) || 0;
  const safeTotal = Number(total) || 0;
  const safeLimit = Number(limit) || 10;
  const from = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const to = Math.min(safePage * safeLimit, safeTotal);

  const goToPage = (nextPage) => {
    if (!onPageChange) return;
    if (nextPage < 1 || nextPage > safeTotalPages || nextPage === safePage) {
      return;
    }

    onPageChange(nextPage);
  };

  return (
    <div className="pagination-bar">
      <p className="text-muted text-sm">
        {safeTotal === 0
          ? "Sin registros"
          : `Mostrando ${from}-${to} de ${safeTotal}`}
      </p>

      <div className="flex items-center gap-2">
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

        <span className="pagination-page" aria-current="page">
          Página {safePage} de {safeTotalPages || 1}
        </span>

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
    </div>
  );
}

export default TablePagination;

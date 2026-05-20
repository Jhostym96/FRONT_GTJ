import { ChevronLeft, ChevronRight } from "lucide-react";

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
        <button
          type="button"
          className="btn-secondary btn-icon"
          disabled={safePage <= 1}
          onClick={() => goToPage(safePage - 1)}
          title="Página anterior"
          aria-label="Página anterior"
        >
          <ChevronLeft />
        </button>

        <span className="pagination-page">
          Página {safePage} de {safeTotalPages || 1}
        </span>

        <button
          type="button"
          className="btn-secondary btn-icon"
          disabled={safeTotalPages === 0 || safePage >= safeTotalPages}
          onClick={() => goToPage(safePage + 1)}
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}

export default TablePagination;

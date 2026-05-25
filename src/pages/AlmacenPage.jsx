import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, Eye, PackagePlus, Pencil, Power, PowerOff } from "lucide-react";
import { notify } from "../utils/notify";
import { useAlmacen } from "../context/AlmacenContext";
import { useUnidades } from "../context/UnidadContext";
import { useConfirm } from "../context/ConfirmContext";
import TablePagination from "../components/TablePagination";
import { formatDateOnly } from "../utils/date";
import { getRecordId } from "../utils/apiData";

const initialItemForm = {
  codigo: "",
  nombre: "",
  tipo: "REPUESTO",
  categoria: "",
  unidadMedida: "UND",
  stockActual: "0",
  stockMinimo: "0",
  precioUnitario: "0",
  ubicacion: "",
  equipoCompatible: "",
  estado: "ACTIVO",
  observaciones: "",
};

const initialMovimientoForm = {
  tipoMovimiento: "ENTRADA",
  cantidad: "",
  responsable: "",
  fechaCompromiso: "",
  motivo: "",
  referencia: "",
  unidadId: "",
};

const formatNumber = (value) => {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const tipoStyles = {
  REPUESTO: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  HERRAMIENTA: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  INSUMO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const getPrecioUnitario = (item) =>
  item?.precioUnitario ?? item?.precio ?? item?.costoUnitario ?? 0;

const getMovimientoLabel = (tipoMovimiento, itemTipo) => {
  if (itemTipo === "HERRAMIENTA") {
    if (tipoMovimiento === "SALIDA") return "PRESTAMO";
    if (tipoMovimiento === "ENTRADA") return "DEVOLUCION";
  }

  if (tipoMovimiento === "AJUSTE") return "AJUSTE";
  return tipoMovimiento || "-";
};

const getMovimientoReferencia = (movimiento) => {
  const referencia = movimiento?.referencia || "";
  const responsable = referencia.match(/MECANICO:\s*([^|]+)/i)?.[1]?.trim();
  const fechaCompromiso = referencia.match(/DEVOLUCION:\s*([^|]+)/i)?.[1]?.trim();
  const referenciaBase = referencia
    .split("|")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part &&
        !part.toUpperCase().startsWith("MECANICO:") &&
        !part.toUpperCase().startsWith("DEVOLUCION:")
    )
    .join(" | ");

  return {
    responsable,
    fechaCompromiso,
    referenciaBase,
  };
};

const buildMovimientoPayload = (form, itemTipo) => {
  if (itemTipo !== "HERRAMIENTA") return form;

  const referenciaParts = [
    form.responsable.trim() ? `MECANICO: ${form.responsable.trim()}` : "",
    form.fechaCompromiso ? `DEVOLUCION: ${form.fechaCompromiso}` : "",
    form.referencia.trim(),
  ].filter(Boolean);

  return {
    tipoMovimiento: form.tipoMovimiento,
    cantidad: form.cantidad,
    unidadId: form.unidadId,
    referencia: referenciaParts.join(" | "),
    motivo: form.motivo,
  };
};

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

function AlmacenPage() {
  const {
    items,
    movimientos,
    resumen,
    paginationItems,
    paginationMovimientos,
    obtenerItems,
    crearItem,
    actualizarItem,
    cambiarEstadoItem,
    registrarMovimiento,
    obtenerMovimientos,
  } = useAlmacen();
  const { unidades = [], obtenerUnidades } = useUnidades();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    search: "",
    tipo: "",
    estado: "",
    bajoStock: false,
  });
  const filtrosRef = useRef(filtros);
  const [searchInput, setSearchInput] = useState("");
  const [itemModal, setItemModal] = useState({
    open: false,
    mode: "create",
    item: null,
  });
  const [movimientoModal, setMovimientoModal] = useState({
    open: false,
    item: null,
  });
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [movimientoForm, setMovimientoForm] = useState(initialMovimientoForm);

  const cargarItems = useCallback(async (page = 1, nextFiltros) => {
    try {
      setLoading(true);
      await obtenerItems({
        page,
        limit: paginationItems.limit,
        ...(nextFiltros ?? filtrosRef.current),
      });
    } finally {
      setLoading(false);
    }
  }, [obtenerItems, paginationItems.limit]);

  useEffect(() => {
    cargarItems(1);
    obtenerUnidades?.({ page: 1, limit: 100 });
  }, [cargarItems, obtenerUnidades]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim();
      if (filtrosRef.current.search === normalizedSearch) return;

      const nextFiltros = { ...filtrosRef.current, search: normalizedSearch };
      filtrosRef.current = nextFiltros;
      setFiltros(nextFiltros);
      cargarItems(1, nextFiltros);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [cargarItems, searchInput]);

  const bajoStock = useMemo(
    () =>
      items.filter(
        (item) => Number(item.stockActual || 0) <= Number(item.stockMinimo || 0)
      ),
    [items]
  );
  const valorInventarioVisible = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + Number(item.stockActual || 0) * Number(getPrecioUnitario(item) || 0),
        0
      ),
    [items]
  );

  const abrirCrear = () => {
    setItemForm(initialItemForm);
    setItemModal({ open: true, mode: "create", item: null });
  };

  const abrirEditar = (item) => {
    setItemForm({
      codigo: item.codigo || "",
      nombre: item.nombre || "",
      tipo: item.tipo || "REPUESTO",
      categoria: item.categoria || "",
      unidadMedida: item.unidadMedida || "UND",
      stockActual: String(item.stockActual ?? "0"),
      stockMinimo: String(item.stockMinimo ?? "0"),
      precioUnitario: String(getPrecioUnitario(item) ?? "0"),
      ubicacion: item.ubicacion || "",
      equipoCompatible: item.equipoCompatible || "",
      estado: item.estado || "ACTIVO",
      observaciones: item.observaciones || "",
    });
    setItemModal({ open: true, mode: "edit", item });
  };

  const abrirVer = async (item) => {
    setItemForm({
      codigo: item.codigo || "",
      nombre: item.nombre || "",
      tipo: item.tipo || "REPUESTO",
      categoria: item.categoria || "",
      unidadMedida: item.unidadMedida || "UND",
      stockActual: String(item.stockActual ?? "0"),
      stockMinimo: String(item.stockMinimo ?? "0"),
      precioUnitario: String(getPrecioUnitario(item) ?? "0"),
      ubicacion: item.ubicacion || "",
      equipoCompatible: item.equipoCompatible || "",
      estado: item.estado || "ACTIVO",
      observaciones: item.observaciones || "",
    });
    setItemModal({ open: true, mode: "view", item });
    await obtenerMovimientos(getRecordId(item), { page: 1, limit: 8 });
  };

  const cerrarItemModal = () => {
    setItemModal({ open: false, mode: "create", item: null });
  };

  const abrirMovimiento = (item) => {
    setMovimientoForm({
      ...initialMovimientoForm,
      tipoMovimiento: item.tipo === "HERRAMIENTA" ? "SALIDA" : "ENTRADA",
    });
    setMovimientoModal({ open: true, item });
  };

  const cerrarMovimientoModal = () => {
    setMovimientoModal({ open: false, item: null });
  };

  const handleFiltroChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (name === "search") {
      setSearchInput(value);
      return;
    }

    const nextFiltros = {
      ...filtros,
      [name]: type === "checkbox" ? checked : value,
    };
    filtrosRef.current = nextFiltros;
    setFiltros(nextFiltros);
    cargarItems(1, nextFiltros);
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMovimientoChange = (e) => {
    const { name, value } = e.target;
    setMovimientoForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();

    if (!itemForm.codigo.trim() || !itemForm.nombre.trim()) {
      notify.error("Código y nombre son obligatorios");
      return;
    }

    try {
      if (itemModal.mode === "edit") {
        await actualizarItem(getRecordId(itemModal.item), itemForm);
        notify.success("Artículo actualizado correctamente");
      } else {
        await crearItem(itemForm);
        notify.success("Artículo creado correctamente");
      }

      cerrarItemModal();
      await cargarItems(paginationItems.page);
    } catch (error) {
      notify.error(error.response?.data?.message || "Error al guardar artículo");
    }
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    const esHerramienta = movimientoModal.item?.tipo === "HERRAMIENTA";

    if (!movimientoForm.cantidad || Number(movimientoForm.cantidad) <= 0) {
      notify.error("Ingresa una cantidad válida");
      return;
    }

    if (
      esHerramienta &&
      ["SALIDA", "ENTRADA"].includes(movimientoForm.tipoMovimiento) &&
      !movimientoForm.responsable.trim()
    ) {
      notify.error("Ingresa el mecánico responsable");
      return;
    }

    try {
      await registrarMovimiento(
        getRecordId(movimientoModal.item),
        buildMovimientoPayload(movimientoForm, movimientoModal.item?.tipo)
      );
      notify.success(
        esHerramienta
          ? movimientoForm.tipoMovimiento === "SALIDA"
            ? "Préstamo registrado correctamente"
            : movimientoForm.tipoMovimiento === "ENTRADA"
              ? "Devolución registrada correctamente"
              : "Ajuste registrado correctamente"
          : "Movimiento registrado correctamente"
      );
      cerrarMovimientoModal();
      await cargarItems(paginationItems.page);
    } catch (error) {
      notify.error(error.response?.data?.message || "Error al registrar movimiento");
    }
  };

  const handleCambiarEstado = async (item) => {
    const nuevoEstado = item.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const confirmar = await confirm({
      title: nuevoEstado === "ACTIVO" ? "Activar artículo" : "Desactivar artículo",
      message: `¿Seguro que deseas ${nuevoEstado === "ACTIVO" ? "activar" : "desactivar"} este artículo?`,
      confirmText: nuevoEstado === "ACTIVO" ? "Activar" : "Desactivar",
      variant: nuevoEstado === "ACTIVO" ? "primary" : "danger",
    });

    if (!confirmar) return;

    try {
      await cambiarEstadoItem(getRecordId(item), nuevoEstado);
      notify.success("Estado actualizado correctamente");
      await cargarItems(paginationItems.page);
    } catch (error) {
      notify.error(error.response?.data?.message || "Error al cambiar estado");
    }
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Mantenimiento y control interno</div>
              <h1 className="page-title">Almacén</h1>
              <p className="page-description">
                Controla repuestos, herramientas e insumos para unidades,
                stacker, montacargas y maquinaria operativa.
              </p>
            </div>

            <button type="button" onClick={abrirCrear} className="btn-primary px-3 py-2">
              Nuevo artículo
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="panel p-4">
            <p className="text-faint text-xs">Artículos registrados</p>
            <p className="text-main mt-1 text-2xl font-bold">{resumen.totalItems || 0}</p>
          </div>
          <div className="panel p-4">
            <p className="text-faint text-xs">Bajo stock</p>
            <p className="text-main mt-1 text-2xl font-bold">{resumen.bajoStock || 0}</p>
          </div>
          <div className="panel p-4">
            <p className="text-faint text-xs">Alertas visibles</p>
            <p className="text-main mt-1 text-2xl font-bold">{bajoStock.length}</p>
          </div>
          <div className="panel p-4">
            <p className="text-faint text-xs">Valorizado</p>
            <p className="text-main mt-1 text-2xl font-bold">
              {formatCurrency(resumen.valorInventario ?? valorInventarioVisible)}
            </p>
          </div>
        </section>

        <section className="panel mt-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
            <input
              name="search"
              value={searchInput}
              onChange={handleFiltroChange}
              className="input p-3"
              placeholder="Buscar por código, nombre, categoría o ubicación"
            />
            <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className="input p-3">
              <option value="">Todos los tipos</option>
              <option value="REPUESTO">Repuestos</option>
              <option value="HERRAMIENTA">Herramientas</option>
              <option value="INSUMO">Insumos</option>
            </select>
            <select name="estado" value={filtros.estado} onChange={handleFiltroChange} className="input p-3">
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="bajoStock"
                checked={filtros.bajoStock}
                onChange={handleFiltroChange}
              />
              Bajo stock
            </label>
          </div>
        </section>

        {loading ? (
          <div className="panel mt-4 p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />
            <p className="text-muted text-sm">Cargando almacén...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-panel mt-4">
            <Boxes className="mx-auto mb-3 h-10 w-10 text-muted" />
            <h2 className="text-main text-lg font-semibold">No hay artículos registrados</h2>
            <button type="button" onClick={abrirCrear} className="btn-primary mt-4 px-3 py-2">
              Crear artículo
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 lg:hidden">
              {items.map((item) => (
                <article key={getRecordId(item)} className="mobile-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-faint text-xs">{item.codigo}</p>
                      <h2 className="text-main text-lg font-bold">{item.nombre}</h2>
                    </div>
                    <Badge className={tipoStyles[item.tipo] || tipoStyles.REPUESTO}>{item.tipo}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="info-tile">
                      <p className="text-faint text-xs">Stock</p>
                      <p className="text-main font-semibold">
                        {formatNumber(item.stockActual)} {item.unidadMedida}
                      </p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Ubicación</p>
                      <p className="text-main font-semibold">{item.ubicacion || "-"}</p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Equipo</p>
                      <p className="text-main font-semibold">{item.equipoCompatible || "-"}</p>
                    </div>
                    <div className="info-tile">
                      <p className="text-faint text-xs">Precio unitario</p>
                      <p className="text-main font-semibold">{formatCurrency(getPrecioUnitario(item))}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <button type="button" onClick={() => abrirVer(item)} className="btn-secondary btn-icon" title="Ver">
                      <Eye />
                    </button>
                    <button type="button" onClick={() => abrirEditar(item)} className="btn-primary btn-icon" title="Editar">
                      <Pencil />
                    </button>
                    <button type="button" onClick={() => abrirMovimiento(item)} className="btn-success btn-icon" title="Movimiento">
                      <PackagePlus />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="data-table-wrap mt-4">
              <div className="table-scroll">
                <table className="data-table w-full min-w-[1220px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Código</th>
                      <th className="px-4 py-4 text-left">Artículo</th>
                      <th className="px-4 py-4 text-left">Tipo</th>
                      <th className="px-4 py-4 text-left">Stock</th>
                      <th className="px-4 py-4 text-left">Mínimo</th>
                      <th className="px-4 py-4 text-left">Precio</th>
                      <th className="px-4 py-4 text-left">Valorizado</th>
                      <th className="px-4 py-4 text-left">Ubicación</th>
                      <th className="px-4 py-4 text-left">Equipo</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const alertaStock =
                        Number(item.stockActual || 0) <= Number(item.stockMinimo || 0);
                      const precioUnitario = getPrecioUnitario(item);
                      const valorStock = Number(item.stockActual || 0) * Number(precioUnitario || 0);
                      return (
                        <tr key={getRecordId(item)}>
                          <td className="whitespace-nowrap px-4 py-4 font-bold text-main">{item.codigo}</td>
                          <td className="px-4 py-4">
                            <p className="text-main font-semibold">{item.nombre}</p>
                            <p className="text-faint text-xs">{item.categoria || "-"}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <Badge className={tipoStyles[item.tipo] || tipoStyles.REPUESTO}>{item.tipo}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <p className={alertaStock ? "font-bold text-red-300" : "text-main font-semibold"}>
                              {formatNumber(item.stockActual)} {item.unidadMedida}
                            </p>
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatNumber(item.stockMinimo)}
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatCurrency(precioUnitario)}
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {formatCurrency(valorStock)}
                          </td>
                          <td className="text-muted whitespace-nowrap px-4 py-4">{item.ubicacion || "-"}</td>
                          <td className="text-muted px-4 py-4">{item.equipoCompatible || "-"}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <Badge
                              className={
                                item.estado === "ACTIVO"
                                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                                  : "border-red-500/30 bg-red-500/10 text-red-300"
                              }
                            >
                              {item.estado}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => abrirVer(item)} className="btn-secondary btn-icon" title="Ver">
                                <Eye />
                              </button>
                              <button type="button" onClick={() => abrirEditar(item)} className="btn-primary btn-icon" title="Editar">
                                <Pencil />
                              </button>
                              <button type="button" onClick={() => abrirMovimiento(item)} className="btn-success btn-icon" title="Movimiento">
                                <PackagePlus />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCambiarEstado(item)}
                                className={`${item.estado === "ACTIVO" ? "btn-danger" : "btn-success"} btn-icon`}
                                title={item.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                              >
                                {item.estado === "ACTIVO" ? <PowerOff /> : <Power />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationItems.page}
              totalPages={paginationItems.totalPages}
              total={paginationItems.total}
              limit={paginationItems.limit}
              onPageChange={(page) => cargarItems(page)}
            />
          </>
        )}

        {itemModal.open && (
          <div className="modal-backdrop">
            <div className="modal-panel max-w-4xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {itemModal.mode === "create"
                      ? "Nuevo artículo"
                      : itemModal.mode === "edit"
                        ? "Editar artículo"
                        : "Detalle de artículo"}
                  </h2>
                  <p className="text-muted text-sm">
                    Repuestos, herramientas e insumos para mantenimiento.
                  </p>
                </div>
                <button type="button" onClick={cerrarItemModal} className="text-muted text-2xl hover:text-blue-500">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitItem} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ["codigo", "Código"],
                  ["nombre", "Nombre"],
                  ["categoria", "Categoría"],
                  ["unidadMedida", "Unidad de medida"],
                  ["stockActual", "Stock actual"],
                  ["stockMinimo", "Stock mínimo"],
                  ["precioUnitario", "Precio unitario"],
                  ["ubicacion", "Ubicación"],
                  ["equipoCompatible", "Equipo compatible"],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className="text-muted mb-1 block text-sm">{label}</label>
                    <input
                      name={name}
                      value={itemForm[name]}
                      onChange={handleItemChange}
                      disabled={itemModal.mode === "view"}
                      type={name.includes("stock") || name === "precioUnitario" ? "number" : "text"}
                      min={name.includes("stock") || name === "precioUnitario" ? "0" : undefined}
                      step={name.includes("stock") || name === "precioUnitario" ? "0.01" : undefined}
                      className="input p-3 uppercase"
                      required={["codigo", "nombre"].includes(name)}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-muted mb-1 block text-sm">Tipo</label>
                  <select name="tipo" value={itemForm.tipo} onChange={handleItemChange} disabled={itemModal.mode === "view"} className="input p-3">
                    <option value="REPUESTO">REPUESTO</option>
                    <option value="HERRAMIENTA">HERRAMIENTA</option>
                    <option value="INSUMO">INSUMO</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted mb-1 block text-sm">Estado</label>
                  <select name="estado" value={itemForm.estado} onChange={handleItemChange} disabled={itemModal.mode === "view"} className="input p-3">
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-muted mb-1 block text-sm">Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={itemForm.observaciones}
                    onChange={handleItemChange}
                    disabled={itemModal.mode === "view"}
                    className="input min-h-[90px] p-3"
                  />
                </div>

                {itemModal.mode === "view" && movimientos.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="text-main mb-3 font-semibold">Últimos movimientos</h3>
                    <div className="table-scroll">
                      <table className="data-table w-full min-w-[720px] text-sm">
                        <thead>
                          <tr>
                            <th className="px-3 py-3 text-left">Fecha</th>
                            <th className="px-3 py-3 text-left">Tipo</th>
                            <th className="px-3 py-3 text-left">Cantidad</th>
                            <th className="px-3 py-3 text-left">Stock nuevo</th>
                            <th className="px-3 py-3 text-left">Responsable</th>
                            <th className="px-3 py-3 text-left">Unidad</th>
                            <th className="px-3 py-3 text-left">Referencia</th>
                            <th className="px-3 py-3 text-left">Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientos.map((movimiento) => {
                            const detalleReferencia = getMovimientoReferencia(movimiento);

                            return (
                              <tr key={getRecordId(movimiento)}>
                                <td className="px-3 py-3">{formatDateOnly(movimiento.createdAt)}</td>
                                <td className="px-3 py-3">
                                  {getMovimientoLabel(movimiento.tipoMovimiento, itemModal.item?.tipo)}
                                </td>
                                <td className="px-3 py-3">{formatNumber(movimiento.cantidad)}</td>
                                <td className="px-3 py-3">{formatNumber(movimiento.stockNuevo)}</td>
                                <td className="px-3 py-3">
                                  <p>{detalleReferencia.responsable || "-"}</p>
                                  {detalleReferencia.fechaCompromiso && (
                                    <p className="text-faint text-xs">
                                      Devuelve: {formatDateOnly(detalleReferencia.fechaCompromiso)}
                                    </p>
                                  )}
                                </td>
                                <td className="px-3 py-3">{movimiento.unidad?.placa || "-"}</td>
                                <td className="px-3 py-3">{detalleReferencia.referenciaBase || "-"}</td>
                                <td className="px-3 py-3">{movimiento.motivo || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {paginationMovimientos.totalPages > 1 && (
                      <TablePagination
                        page={paginationMovimientos.page}
                        totalPages={paginationMovimientos.totalPages}
                        total={paginationMovimientos.total}
                        limit={paginationMovimientos.limit}
                        onPageChange={(page) => obtenerMovimientos(getRecordId(itemModal.item), { page, limit: 8 })}
                      />
                    )}
                  </div>
                )}

                {itemModal.mode !== "view" && (
                  <div className="flex justify-end gap-3 md:col-span-2">
                    <button type="button" onClick={cerrarItemModal} className="btn-secondary px-4 py-2">
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary px-4 py-2">
                      Guardar
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {movimientoModal.open && (
          <div className="modal-backdrop">
            <div className="modal-panel max-w-xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {movimientoModal.item?.tipo === "HERRAMIENTA"
                      ? movimientoForm.tipoMovimiento === "SALIDA"
                        ? "Prestar herramienta"
                        : movimientoForm.tipoMovimiento === "ENTRADA"
                          ? "Registrar devolución"
                          : "Ajustar herramientas"
                      : "Registrar movimiento"}
                  </h2>
                  <p className="text-muted text-sm">
                    {movimientoModal.item?.codigo} - {movimientoModal.item?.nombre}
                  </p>
                </div>
                <button type="button" onClick={cerrarMovimientoModal} className="text-muted text-2xl hover:text-blue-500">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitMovimiento} className="grid gap-4">
                <div>
                  <label className="text-muted mb-1 block text-sm">
                    {movimientoModal.item?.tipo === "HERRAMIENTA" ? "Tipo de préstamo" : "Tipo de movimiento"}
                  </label>
                  <select name="tipoMovimiento" value={movimientoForm.tipoMovimiento} onChange={handleMovimientoChange} className="input p-3">
                    {movimientoModal.item?.tipo === "HERRAMIENTA" ? (
                      <>
                        <option value="SALIDA">PRESTAMO</option>
                        <option value="ENTRADA">DEVOLUCION</option>
                      </>
                    ) : (
                      <>
                        <option value="ENTRADA">ENTRADA</option>
                        <option value="SALIDA">SALIDA</option>
                      </>
                    )}
                    <option value="AJUSTE">AJUSTE DE STOCK</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted mb-1 block text-sm">
                    {movimientoForm.tipoMovimiento === "AJUSTE"
                      ? "Stock final"
                      : movimientoModal.item?.tipo === "HERRAMIENTA"
                        ? "Cantidad de herramientas"
                        : "Cantidad"}
                  </label>
                  <input
                    name="cantidad"
                    value={movimientoForm.cantidad}
                    onChange={handleMovimientoChange}
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    className="input p-3"
                  />
                </div>
                {movimientoModal.item?.tipo === "HERRAMIENTA" &&
                  movimientoForm.tipoMovimiento !== "AJUSTE" && (
                    <>
                      <div>
                        <label className="text-muted mb-1 block text-sm">
                          Mecánico responsable
                        </label>
                        <input
                          name="responsable"
                          value={movimientoForm.responsable}
                          onChange={handleMovimientoChange}
                          className="input p-3 uppercase"
                          placeholder="Nombre del mecánico"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-muted mb-1 block text-sm">
                          Fecha compromiso de devolución
                        </label>
                        <input
                          name="fechaCompromiso"
                          value={movimientoForm.fechaCompromiso}
                          onChange={handleMovimientoChange}
                          type="date"
                          className="input p-3"
                          disabled={movimientoForm.tipoMovimiento === "ENTRADA"}
                        />
                      </div>
                    </>
                  )}
                <div>
                  <label className="text-muted mb-1 block text-sm">
                    {movimientoModal.item?.tipo === "HERRAMIENTA"
                      ? "Unidad o maquinaria que recibe/devuelve"
                      : "Unidad o maquinaria relacionada"}
                  </label>
                  <select name="unidadId" value={movimientoForm.unidadId} onChange={handleMovimientoChange} className="input p-3">
                    <option value="">Sin unidad específica</option>
                    {unidades.map((unidad) => (
                      <option key={getRecordId(unidad)} value={getRecordId(unidad)}>
                        {unidad.placa} - {unidad.tipoUnidad}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-muted mb-1 block text-sm">
                    {movimientoModal.item?.tipo === "HERRAMIENTA"
                      ? "Referencia de trabajo u orden"
                      : "Referencia"}
                  </label>
                  <input
                    name="referencia"
                    value={movimientoForm.referencia}
                    onChange={handleMovimientoChange}
                    className="input p-3"
                  />
                </div>
                <div>
                  <label className="text-muted mb-1 block text-sm">
                    {movimientoModal.item?.tipo === "HERRAMIENTA"
                      ? "Observación del préstamo/devolución"
                      : "Motivo"}
                  </label>
                  <textarea
                    name="motivo"
                    value={movimientoForm.motivo}
                    onChange={handleMovimientoChange}
                    className="input min-h-[90px] p-3"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={cerrarMovimientoModal} className="btn-secondary px-4 py-2">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary px-4 py-2">
                    Registrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlmacenPage;

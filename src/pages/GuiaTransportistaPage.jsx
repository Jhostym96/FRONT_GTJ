import { useEffect, useState } from "react";
import { notify } from "../utils/notify";
import {
  Ban,
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  SearchCheck,
  Send,
} from "lucide-react";
import { useGuiaTransportista } from "../context/GuiaTransportistaContext";
import { useConfirm } from "../context/ConfirmContext";

import GuiaTransportistaModal from "../components/modals/GuiaTransportistaModal";
import TablePagination from "../components/TablePagination";

const GuiaTransportistaPage = () => {
  const {
    guiasTransportista = [],
    loadingGuia,
    paginationGuias,
    obtenerGuiasTransportista,
    enviarGuiaTransportistaNubefact,
    consultarGuiaTransportista,
    anularGuiaTransportista,
    abrirPdfOficialGuiaTransportista,
  } = useGuiaTransportista();
  const confirm = useConfirm();

  const [anulando, setAnulando] = useState({});
  const [consultandoSunat, setConsultandoSunat] = useState({});
  const [abriendoTicket, setAbriendoTicket] = useState({});

  const [openGuiaModal, setOpenGuiaModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);

  useEffect(() => {
    obtenerGuiasTransportista({ page: 1, limit: 10 });
  }, [obtenerGuiasTransportista]);

  const recargarGuias = (page = paginationGuias.page) =>
    obtenerGuiasTransportista({ page, limit: paginationGuias.limit });

  const getGuiaId = (guia) => {
    return guia?.id || guia?._id;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";

    if (typeof fecha === "string" && /^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
      return fecha;
    }

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";

      case "GENERADA":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";

      case "ENVIADA":
        return "bg-orange-500/10 text-orange-300 border-orange-500/30";

      case "ACEPTADA":
        return "bg-green-500/10 text-green-300 border-green-500/30";

      case "RECHAZADA":
      case "ERROR":
        return "bg-red-500/10 text-red-300 border-red-500/30";

      case "ANULADA":
        return "bg-red-500/10 text-red-300 border-red-500/30";

      default:
        return "text-muted";
    }
  };

  const abrirCrear = () => {
    setModalMode("create");
    setGuiaSeleccionada(null);
    setOpenGuiaModal(true);
  };

  const abrirVer = (guia) => {
    setModalMode("view");
    setGuiaSeleccionada(guia);
    setOpenGuiaModal(true);
  };

  const abrirEditar = (guia) => {
    setModalMode("edit");
    setGuiaSeleccionada(guia);
    setOpenGuiaModal(true);
  };

  const cerrarGuiaModal = () => {
    setOpenGuiaModal(false);
    setGuiaSeleccionada(null);
    setModalMode("create");
    recargarGuias();
  };

  const handleConsultarSunat = async (guia) => {
    const id = getGuiaId(guia);

    if (!id) {
      notify.error("No se encontró el ID de la guía");
      return;
    }

    try {
      setConsultandoSunat((prev) => ({ ...prev, [id]: true }));

      const res = await consultarGuiaTransportista(id);

      if (res?.guia?.estado === "ACEPTADA") {
        notify.success("Guía aceptada por SUNAT");
      } else if (res?.guia?.estado === "RECHAZADA") {
        notify.error("Guía rechazada por SUNAT");
      } else if (res?.guia?.estado === "ERROR") {
        notify.error("Nubefact devolvió errores en la guía");
      } else {
        notify.success("Consulta realizada correctamente");
      }

      await recargarGuias();
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Error al consultar SUNAT/Nubefact"
      );
    } finally {
      setConsultandoSunat((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleEnviarNubefact = async (guia) => {
    const id = getGuiaId(guia);

    if (!id) {
      notify.error("No se encontró el ID de la guía");
      return;
    }

    const confirmar = await confirm({
      title: "Enviar a Nubefact",
      message:
        "Se enviará esta guía a Nubefact. Después del envío ya no podrás editarla si es aceptada/generada.",
      confirmText: "Enviar",
      variant: "primary",
    });

    if (!confirmar) return;

    try {
      setConsultandoSunat((prev) => ({ ...prev, [id]: true }));

      const res = await enviarGuiaTransportistaNubefact(id);

      if (res?.guia?.estado === "ERROR") {
        notify.error("Nubefact devolvió errores en la guía");
      } else {
        notify.success("Guía enviada a Nubefact correctamente");
      }

      await recargarGuias();
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          error.response?.data?.errors ||
          "Error al enviar la guía a Nubefact"
      );
    } finally {
      setConsultandoSunat((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleTicket = async (guia) => {
    const id = getGuiaId(guia);

    if (!id) {
      notify.error("No se encontró el ID de la guía");
      return;
    }

    try {
      setAbriendoTicket((prev) => ({ ...prev, [id]: true }));

      await abrirPdfOficialGuiaTransportista(id);
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
        error.message ||
        "Error al abrir el PDF oficial de Nubefact"
      );
    } finally {
      setAbriendoTicket((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleAnular = async (guia) => {
    const id = getGuiaId(guia);
    const numeroGuia =
      [guia?.serie, guia?.numero].filter(Boolean).join("-") || "ANULAR";

    if (!id) {
      notify.error("No se encontró el ID de la guía");
      return;
    }

    const confirmar = await confirm({
      title: "Anular guía",
      message:
        `Esta anulación es interna del sistema. No se enviará a Nubefact y la programación quedará disponible para generar otra guía. Para continuar, confirma la guía ${numeroGuia}.`,
      confirmText: "Anular",
      variant: "danger",
      confirmationText: numeroGuia,
      confirmationLabel: "Número de guía",
    });

    if (!confirmar) return;

    try {
      setAnulando((prev) => ({ ...prev, [id]: true }));

      await anularGuiaTransportista(id);

      notify.success("Guía anulada correctamente");

      const nextPage =
        guiasTransportista.length === 1 && paginationGuias.page > 1
          ? paginationGuias.page - 1
          : paginationGuias.page;
      await recargarGuias(nextPage);
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Error al anular la guía"
      );
    } finally {
      setAnulando((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePageChange = (page) => {
    recargarGuias(page);
  };

  const EstadoBadge = ({ estado }) => (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${getEstadoStyle(
        estado
      )}`}
    >
      {estado || "SIN ESTADO"}
    </span>
  );

  const obtenerDatosProgramacion = (guia) => {
    const programacion =
      guia?.programacionViaje || guia?.programacion || guia?.viaje || null;

    const orden =
      programacion?.ordenServicio || guia?.ordenServicio || guia?.orden || null;

    return {
      orden,

      cliente:
        orden?.clienteSolicitante ||
        orden?.cliente ||
        guia?.clienteSolicitante ||
        guia?.cliente ||
        null,

      remitente: orden?.remitente || guia?.remitente || null,

      destinatario: orden?.destinatario || guia?.destinatario || null,

      unidad:
        programacion?.vehiculoPrincipal ||
        programacion?.unidad ||
        programacion?.vehiculo ||
        guia?.vehiculoPrincipal ||
        guia?.unidad ||
        null,

      conductor: programacion?.conductor || guia?.conductor || null,

      fechaInicioTraslado:
        programacion?.fechaInicioTraslado ||
        guia?.fecha_de_inicio_de_traslado ||
        guia?.fechaInicioTraslado ||
        null,
    };
  };

  const obtenerNombreRemitente = (datos, guia) =>
    datos.remitente?.razonSocial ||
    datos.remitente?.denominacion ||
    datos.remitente?.nombre ||
    datos.orden?.remitenteRazonSocial ||
    guia.remitente_denominacion ||
    guia.cliente_denominacion ||
    "-";

  const obtenerDocumentoRemitente = (datos, guia) =>
    datos.remitente?.numeroDocumento ||
    datos.orden?.remitenteNumeroDocumento ||
    guia.remitente_numero_de_documento ||
    guia.cliente_numero_de_documento ||
    "";

  const AccionesGuia = ({ guia, mobile = false }) => {
    const id = getGuiaId(guia);
    const actionClass = (variant) => (mobile ? variant : `${variant} btn-icon`);

    return (
      <div className={mobile ? "mobile-actions" : "table-actions"}>
        <button
          type="button"
          onClick={() => abrirVer(guia)}
          className={actionClass("btn-secondary")}
          title="Ver guía"
          aria-label="Ver guía"
        >
          <Eye />
          {mobile && "Ver"}
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(guia)}
          disabled={["ANULADA", "ENVIADA", "GENERADA", "ACEPTADA"].includes(guia.estado)}
          className={actionClass("btn-primary")}
          title="Editar guía"
          aria-label="Editar guía"
        >
          <Pencil />
          {mobile && "Editar"}
        </button>

        {["PENDIENTE", "ERROR"].includes(guia.estado) && (
          <button
            type="button"
            onClick={() => handleEnviarNubefact(guia)}
            disabled={consultandoSunat[id] || guia.estado === "ANULADA"}
            className={actionClass("btn-success")}
            title="Enviar a Nubefact"
            aria-label="Enviar a Nubefact"
          >
            {consultandoSunat[id] ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
            {mobile && "Enviar"}
          </button>
        )}

        {["ENVIADA", "GENERADA"].includes(guia.estado) && (
            <button
              type="button"
              onClick={() => handleConsultarSunat(guia)}
              disabled={consultandoSunat[id] || guia.estado === "ANULADA"}
              className={actionClass("btn-success")}
              title="Consultar SUNAT"
              aria-label="Consultar SUNAT"
            >
              {consultandoSunat[id] ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <SearchCheck />
              )}
              {mobile && "SUNAT"}
            </button>
          )}

        <button
          type="button"
          onClick={() => handleTicket(guia)}
          disabled={abriendoTicket[id] || guia.estado === "ANULADA"}
          title="Abrir PDF oficial de Nubefact"
          aria-label="Abrir PDF oficial de Nubefact"
          className={mobile ? "btn bg-amber-600 text-white hover:bg-amber-500" : "btn btn-icon bg-amber-600 text-white hover:bg-amber-500"}
        >
          {abriendoTicket[id] ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <FileText />
          )}
          {mobile && "PDF"}
        </button>

        {guia.estado !== "ANULADA" && (
          <button
            type="button"
            onClick={() => handleAnular(guia)}
            disabled={anulando[id]}
            className={actionClass("btn-danger")}
            title="Anular guía"
            aria-label="Anular guía"
          >
            {anulando[id] ? <LoaderCircle className="animate-spin" /> : <Ban />}
            {mobile && "Anular"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">
                Emisión de guías
              </div>

              <h1 className="page-title">
                Guías de Transportista
              </h1>

              <p className="page-description">
                Genera, visualiza y administra las guías de transportista
                vinculadas a tus viajes programados.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary px-3 py-2"
            >
              Nueva guía
            </button>
          </div>
        </header>

        {loadingGuia ? (
          <div className="loading-panel">
            <div className="loading-spinner" />

            <p className="text-muted text-sm">
              Cargando guías de transportista...
            </p>
          </div>
        ) : guiasTransportista.length === 0 ? (
          <div className="empty-panel">
            <h2 className="text-main text-lg font-semibold">
              No hay guías registradas
            </h2>

            <p className="text-muted mt-1 text-sm">
              Crea tu primera guía desde una programación de viaje.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="btn-primary mt-4 px-3 py-2"
            >
              Crear guía
            </button>
          </div>
        ) : (
          <>
            <div className="mobile-list">
              {guiasTransportista.map((guia) => {
                const datos = obtenerDatosProgramacion(guia);
                const id = getGuiaId(guia);

                return (
                  <article
                    key={id}
                    className="mobile-card"
                  >
                    <div className="mobile-card-header">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          Guía
                        </p>

                        <h2 className="mobile-card-title">
                          {guia.serie || "-"}-{guia.numero || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={guia.estado} />
                    </div>

                    <div className="mobile-detail-grid">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Emisión</p>

                        <p className="text-main font-semibold">
                          {guia.fecha_de_emision ||
                            formatearFecha(guia.fechaEmision) ||
                            "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Remitente</p>

                        <p className="text-main font-semibold">
                          {obtenerNombreRemitente(datos, guia)}
                        </p>

                        <p className="text-faint text-xs">
                          {obtenerDocumentoRemitente(datos, guia)}
                        </p>
                      </div>

                      <div className="mobile-detail-grid-2">
                        <div className="info-tile">
                          <p className="text-faint text-xs">Unidad</p>

                          <p className="text-main font-semibold">
                            {datos.unidad?.placa ||
                              guia.transportista_placa_numero ||
                              "-"}
                          </p>
                        </div>

                        <div className="info-tile">
                          <p className="text-faint text-xs">
                            Conductor
                          </p>

                          <p className="text-main font-semibold">
                            {datos.conductor
                              ? `${datos.conductor.nombres || ""} ${datos.conductor.apellidos || ""
                              }`
                              : guia.conductor_denominacion ||
                              guia.conductor_nombre ||
                              "-"}
                          </p>
                        </div>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Traslado</p>

                        <p className="text-main font-semibold">
                          {guia.fecha_de_inicio_de_traslado ||
                            formatearFecha(datos.fechaInicioTraslado)}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">
                          Peso / Bultos
                        </p>

                        <p className="text-main font-semibold">
                          {guia.peso_bruto_total || "-"}{" "}
                          {guia.peso_bruto_unidad_de_medida || "KGM"} /{" "}
                          {guia.numero_de_bultos || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mobile-card-actions">
                      <AccionesGuia guia={guia} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="table-scroll">
                <table className="data-table dense-table w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Guía</th>
                      <th className="px-4 py-4 text-left">Emisión</th>
                      <th className="px-4 py-4 text-left">Remitente</th>
                      <th className="px-4 py-4 text-left">Unidad</th>
                      <th className="px-4 py-4 text-left">Conductor</th>
                      <th className="px-4 py-4 text-left">Inicio traslado</th>
                      <th className="px-4 py-4 text-left">Peso/Bultos</th>
                      <th className="px-4 py-4 text-center">Estado</th>
                      <th className="px-4 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {guiasTransportista.map((guia) => {
                      const datos = obtenerDatosProgramacion(guia);
                      const id = getGuiaId(guia);

                      return (
                        <tr key={id}>
                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="text-main font-bold">
                              {guia.serie || "-"}-{guia.numero || "-"}
                            </p>
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {guia.fecha_de_emision ||
                              formatearFecha(guia.fechaEmision) ||
                              "-"}
                          </td>

                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[250px] truncate font-semibold">
                              {obtenerNombreRemitente(datos, guia)}
                            </p>

                            <p className="text-faint text-xs">
                              {obtenerDocumentoRemitente(datos, guia)}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="text-main font-semibold">
                              {datos.unidad?.placa ||
                                guia.transportista_placa_numero ||
                                "-"}
                            </p>

                            <p className="text-faint text-xs">
                              {datos.unidad?.tipoUnidad || ""}
                            </p>
                          </td>

                          <td className="min-w-[220px] px-4 py-4">
                            <p className="text-main max-w-[250px] truncate font-semibold">
                              {datos.conductor
                                ? `${datos.conductor.nombres || ""} ${datos.conductor.apellidos || ""
                                }`
                                : guia.conductor_denominacion ||
                                guia.conductor_nombre ||
                                "-"}
                            </p>

                            <p className="text-faint text-xs">
                              {datos.conductor?.numeroDocumento ||
                                guia.conductor_documento_numero ||
                                ""}
                            </p>
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {guia.fecha_de_inicio_de_traslado ||
                              formatearFecha(datos.fechaInicioTraslado)}
                          </td>

                          <td className="text-muted whitespace-nowrap px-4 py-4">
                            {guia.peso_bruto_total || "-"}{" "}
                            {guia.peso_bruto_unidad_de_medida || "KGM"} /{" "}
                            {guia.numero_de_bultos || "-"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-center">
                            <EstadoBadge estado={guia.estado} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <AccionesGuia guia={guia} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <TablePagination
              page={paginationGuias.page}
              totalPages={paginationGuias.totalPages}
              total={paginationGuias.total}
              limit={paginationGuias.limit}
              onPageChange={handlePageChange}
            />
          </>
        )}

        <GuiaTransportistaModal
          isOpen={openGuiaModal}
          onClose={cerrarGuiaModal}
          mode={modalMode}
          guia={guiaSeleccionada}
        />
      </div>
    </div>
  );
};

export default GuiaTransportistaPage;

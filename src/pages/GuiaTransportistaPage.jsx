import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useGuiaTransportista } from "../context/GuiaTransportistaContext";

import GuiaTransportistaModal from "../components/modals/GuiaTransportistaModal";

const GuiaTransportistaPage = () => {
  const {
    guiasTransportista = [],
    loadingGuia,
    obtenerGuiasTransportista,
    generarJsonGuiaTransportista,
    consultarGuiaTransportista,
    anularGuiaTransportista,
    abrirPdfOficialGuiaTransportista,
  } = useGuiaTransportista();

  const [anulando, setAnulando] = useState({});
  const [generandoJson, setGenerandoJson] = useState({});
  const [consultandoSunat, setConsultandoSunat] = useState({});
  const [abriendoTicket, setAbriendoTicket] = useState({});

  const [openGuiaModal, setOpenGuiaModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);

  useEffect(() => {
    obtenerGuiasTransportista();
  }, []);

  const totalGuias = useMemo(
    () => guiasTransportista?.length || 0,
    [guiasTransportista]
  );

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
  };

  const handleGenerarJson = async (guia) => {
    const id = getGuiaId(guia);

    if (!id) {
      toast.error("No se encontró el ID de la guía");
      return;
    }

    try {
      setGenerandoJson((prev) => ({ ...prev, [id]: true }));

      await generarJsonGuiaTransportista(id);

      toast.success("JSON generado correctamente");

      await obtenerGuiasTransportista();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Error al generar el JSON de la guía"
      );
    } finally {
      setGenerandoJson((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleConsultarSunat = async (guia) => {
    const id = getGuiaId(guia);

    if (!id) {
      toast.error("No se encontró el ID de la guía");
      return;
    }

    try {
      setConsultandoSunat((prev) => ({ ...prev, [id]: true }));

      const res = await consultarGuiaTransportista(id);

      if (res?.guia?.estado === "ACEPTADA") {
        toast.success("Guía aceptada por SUNAT");
      } else if (res?.guia?.estado === "RECHAZADA") {
        toast.error("Guía rechazada por SUNAT");
      } else if (res?.guia?.estado === "ERROR") {
        toast.error("Nubefact devolvió errores en la guía");
      } else {
        toast.success("Consulta realizada correctamente");
      }

      await obtenerGuiasTransportista();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Error al consultar SUNAT/Nubefact"
      );
    } finally {
      setConsultandoSunat((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleTicket = async (guia) => {
    const id = getGuiaId(guia);

    if (!id) {
      toast.error("No se encontró el ID de la guía");
      return;
    }

    try {
      setAbriendoTicket((prev) => ({ ...prev, [id]: true }));

      await abrirPdfOficialGuiaTransportista(id);
    } catch (error) {
      toast.error(
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

    if (!id) {
      toast.error("No se encontró el ID de la guía");
      return;
    }

    const confirmar = window.confirm(
      "¿Seguro que deseas anular esta guía de transportista?"
    );

    if (!confirmar) return;

    try {
      setAnulando((prev) => ({ ...prev, [id]: true }));

      await anularGuiaTransportista(id);

      toast.success("Guía anulada correctamente");

      await obtenerGuiasTransportista();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        "Error al anular la guía"
      );
    } finally {
      setAnulando((prev) => ({ ...prev, [id]: false }));
    }
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

  const AccionesGuia = ({ guia, mobile = false }) => {
    const id = getGuiaId(guia);

    return (
      <div
        className={`flex ${mobile ? "w-full flex-col sm:flex-row" : "justify-center"
          } flex-wrap gap-2`}
      >
        <button
          type="button"
          onClick={() => abrirVer(guia)}
          className="btn-secondary px-3 py-2 text-xs"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(guia)}
          disabled={["ANULADA", "ENVIADA", "ACEPTADA"].includes(guia.estado)}
          className="btn-primary px-3 py-2 text-xs"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => handleGenerarJson(guia)}
          disabled={generandoJson[id] || guia.estado === "ANULADA"}
          className="btn-success px-3 py-2 text-xs"
        >
          {generandoJson[id] ? "Generando..." : "JSON"}
        </button>

        {["ENVIADA", "GENERADA", "PENDIENTE", "ERROR"].includes(
          guia.estado
        ) && (
            <button
              type="button"
              onClick={() => handleConsultarSunat(guia)}
              disabled={consultandoSunat[id] || guia.estado === "ANULADA"}
              className="btn-success px-3 py-2 text-xs"
            >
              {consultandoSunat[id] ? "Consultando..." : "Consultar SUNAT"}
            </button>
          )}

        <button
          type="button"
          onClick={() => handleTicket(guia)}
          disabled={abriendoTicket[id] || guia.estado === "ANULADA"}
          title="Abrir PDF oficial de Nubefact"
          className="btn bg-amber-600 px-3 py-2 text-xs text-white hover:bg-amber-500"
        >
          {abriendoTicket[id] ? "Abriendo..." : "Ticket"}
        </button>

        {guia.estado !== "ANULADA" && guia.estado !== "ACEPTADA" && (
          <button
            type="button"
            onClick={() => handleAnular(guia)}
            disabled={anulando[id]}
            className="btn-danger px-3 py-2 text-xs"
          >
            {anulando[id] ? "Anulando..." : "Anular"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="info-tile border px-4 py-3">
                <p className="text-faint text-xs">Total guías</p>
                <p className="text-main text-xl font-bold">
                  {totalGuias}
                </p>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="btn-primary px-5 py-3"
              >
                Nueva guía
              </button>
            </div>
          </div>
        </header>

        {loadingGuia ? (
          <div className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-blue-500" />

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
              className="btn-primary mt-5 px-5 py-3"
            >
              Crear guía
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:hidden">
              {guiasTransportista.map((guia) => {
                const datos = obtenerDatosProgramacion(guia);
                const id = getGuiaId(guia);

                return (
                  <article
                    key={id}
                    className="mobile-card"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-faint text-xs font-medium">
                          Guía
                        </p>

                        <h2 className="text-main text-lg font-bold">
                          {guia.serie || "-"}-{guia.numero || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={guia.estado} />
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="info-tile">
                        <p className="text-faint text-xs">Emisión</p>

                        <p className="text-main font-semibold">
                          {guia.fecha_de_emision ||
                            formatearFecha(guia.fechaEmision) ||
                            "-"}
                        </p>
                      </div>

                      <div className="info-tile">
                        <p className="text-faint text-xs">Cliente</p>

                        <p className="text-main font-semibold">
                          {datos.cliente?.razonSocial ||
                            datos.cliente?.denominacion ||
                            datos.cliente?.nombre ||
                            guia.cliente_denominacion ||
                            "-"}
                        </p>

                        <p className="text-faint text-xs">
                          {datos.cliente?.numeroDocumento ||
                            guia.cliente_numero_de_documento ||
                            ""}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
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

                    <div className="mt-4 border-t pt-4">
                      <AccionesGuia guia={guia} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="data-table-wrap">
              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-4 text-left">Guía</th>
                      <th className="px-4 py-4 text-left">Emisión</th>
                      <th className="px-4 py-4 text-left">Cliente</th>
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
                              {datos.cliente?.razonSocial ||
                                datos.cliente?.denominacion ||
                                datos.cliente?.nombre ||
                                guia.cliente_denominacion ||
                                "-"}
                            </p>

                            <p className="text-faint text-xs">
                              {datos.cliente?.numeroDocumento ||
                                guia.cliente_numero_de_documento ||
                                ""}
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

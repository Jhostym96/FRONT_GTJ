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
        return "bg-neutral-700/40 text-neutral-300 border-neutral-600";
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
          className="rounded-lg bg-neutral-700/80 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:bg-neutral-600"
        >
          Ver
        </button>

        <button
          type="button"
          onClick={() => abrirEditar(guia)}
          disabled={["ANULADA", "ENVIADA", "ACEPTADA"].includes(guia.estado)}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => handleGenerarJson(guia)}
          disabled={generandoJson[id] || guia.estado === "ANULADA"}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
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
              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
            >
              {consultandoSunat[id] ? "Consultando..." : "Consultar SUNAT"}
            </button>
          )}

        <button
          type="button"
          onClick={() => handleTicket(guia)}
          disabled={abriendoTicket[id] || guia.estado === "ANULADA"}
          title="Abrir PDF oficial de Nubefact"
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
        >
          {abriendoTicket[id] ? "Abriendo..." : "Ticket"}
        </button>

        {guia.estado !== "ANULADA" && guia.estado !== "ACEPTADA" && (
          <button
            type="button"
            onClick={() => handleAnular(guia)}
            disabled={anulando[id]}
            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            {anulando[id] ? "Anulando..." : "Anular"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-2 py-4 text-text-primary sm:px-4 lg:px-4">
      <div className="mx-auto flex w-full max-w-[98%] flex-col gap-5">
        <header className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 shadow-xl">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Emisión de guías
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-gray-100 sm:text-3xl">
                Guías de Transportista
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-neutral-400">
                Genera, visualiza y administra las guías de transportista
                vinculadas a tus viajes programados.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 px-4 py-3">
                <p className="text-xs text-neutral-500">Total guías</p>
                <p className="text-xl font-bold text-gray-100">
                  {totalGuias}
                </p>
              </div>

              <button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 active:scale-[0.98]"
              >
                Nueva guía
              </button>
            </div>
          </div>
        </header>

        {loadingGuia ? (
          <div className="rounded-2xl border border-neutral-800 bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-500" />

            <p className="text-sm text-neutral-400">
              Cargando guías de transportista...
            </p>
          </div>
        ) : guiasTransportista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-700 bg-surface p-8 text-center shadow-lg">
            <h2 className="text-lg font-semibold text-gray-200">
              No hay guías registradas
            </h2>

            <p className="mt-1 text-sm text-neutral-400">
              Crea tu primera guía desde una programación de viaje.
            </p>

            <button
              type="button"
              onClick={abrirCrear}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
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
                    className="rounded-2xl border border-neutral-800 bg-surface p-4 shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-neutral-500">
                          Guía
                        </p>

                        <h2 className="text-lg font-bold text-gray-100">
                          {guia.serie || "-"}-{guia.numero || "-"}
                        </h2>
                      </div>

                      <EstadoBadge estado={guia.estado} />
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Emisión</p>

                        <p className="font-semibold text-neutral-200">
                          {guia.fecha_de_emision ||
                            formatearFecha(guia.fechaEmision) ||
                            "-"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Cliente</p>

                        <p className="font-semibold text-gray-200">
                          {datos.cliente?.razonSocial ||
                            datos.cliente?.denominacion ||
                            datos.cliente?.nombre ||
                            guia.cliente_denominacion ||
                            "-"}
                        </p>

                        <p className="text-xs text-neutral-500">
                          {datos.cliente?.numeroDocumento ||
                            guia.cliente_numero_de_documento ||
                            ""}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-neutral-900/60 p-3">
                          <p className="text-xs text-neutral-500">Unidad</p>

                          <p className="font-semibold text-gray-200">
                            {datos.unidad?.placa ||
                              guia.transportista_placa_numero ||
                              "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-neutral-900/60 p-3">
                          <p className="text-xs text-neutral-500">
                            Conductor
                          </p>

                          <p className="font-semibold text-gray-200">
                            {datos.conductor
                              ? `${datos.conductor.nombres || ""} ${datos.conductor.apellidos || ""
                              }`
                              : guia.conductor_denominacion ||
                              guia.conductor_nombre ||
                              "-"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">Traslado</p>

                        <p className="font-semibold text-neutral-200">
                          {guia.fecha_de_inicio_de_traslado ||
                            formatearFecha(datos.fechaInicioTraslado)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-neutral-900/60 p-3">
                        <p className="text-xs text-neutral-500">
                          Peso / Bultos
                        </p>

                        <p className="font-semibold text-neutral-200">
                          {guia.peso_bruto_total || "-"}{" "}
                          {guia.peso_bruto_unidad_de_medida || "KGM"} /{" "}
                          {guia.numero_de_bultos || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-neutral-800 pt-4">
                      <AccionesGuia guia={guia} mobile />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-neutral-800 bg-surface shadow-xl lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1300px] text-sm">
                  <thead className="bg-neutral-900">
                    <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-400">
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

                  <tbody className="divide-y divide-neutral-800">
                    {guiasTransportista.map((guia) => {
                      const datos = obtenerDatosProgramacion(guia);
                      const id = getGuiaId(guia);

                      return (
                        <tr
                          key={id}
                          className="bg-neutral-950/20 transition hover:bg-neutral-800/50"
                        >
                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="font-bold text-gray-100">
                              {guia.serie || "-"}-{guia.numero || "-"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-neutral-300">
                            {guia.fecha_de_emision ||
                              formatearFecha(guia.fechaEmision) ||
                              "-"}
                          </td>

                          <td className="min-w-[220px] px-4 py-4">
                            <p className="max-w-[250px] truncate font-semibold text-gray-200">
                              {datos.cliente?.razonSocial ||
                                datos.cliente?.denominacion ||
                                datos.cliente?.nombre ||
                                guia.cliente_denominacion ||
                                "-"}
                            </p>

                            <p className="text-xs text-neutral-500">
                              {datos.cliente?.numeroDocumento ||
                                guia.cliente_numero_de_documento ||
                                ""}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4">
                            <p className="font-semibold text-gray-200">
                              {datos.unidad?.placa ||
                                guia.transportista_placa_numero ||
                                "-"}
                            </p>

                            <p className="text-xs text-neutral-500">
                              {datos.unidad?.tipoUnidad || ""}
                            </p>
                          </td>

                          <td className="min-w-[220px] px-4 py-4">
                            <p className="max-w-[250px] truncate font-semibold text-gray-200">
                              {datos.conductor
                                ? `${datos.conductor.nombres || ""} ${datos.conductor.apellidos || ""
                                }`
                                : guia.conductor_denominacion ||
                                guia.conductor_nombre ||
                                "-"}
                            </p>

                            <p className="text-xs text-neutral-500">
                              {datos.conductor?.numeroDocumento ||
                                guia.conductor_documento_numero ||
                                ""}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-neutral-300">
                            {guia.fecha_de_inicio_de_traslado ||
                              formatearFecha(datos.fechaInicioTraslado)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-neutral-300">
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

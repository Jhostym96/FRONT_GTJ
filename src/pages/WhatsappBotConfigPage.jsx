import { useEffect, useState } from "react";
import { BellRing, MessageCircle, RefreshCw, Save, Send } from "lucide-react";
import { useEmpresaConfig } from "../context/EmpresaConfigContext";
import {
  enviarWhatsappPruebaRequest,
  listarWhatsappGruposRequest,
  obtenerWhatsappStatusRequest,
} from "../api/whatsapp";
import { notify } from "../utils/notify";

const initialTest = {
  number: "",
  text: "Mensaje operativo desde Transporte J.",
};

const initialAlertasRules = {
  activo: true,
  hora: "08:00",
  diasInicio: 15,
  modoDiario: false,
  contenedoresHora: "08:15",
  contenedoresDiasInicio: 7,
  documentacion: true,
  ordenes: true,
  programaciones: true,
  contenedores: true,
};

const getGroupJid = (group) =>
  group?.jid || group?.JID || group?.id || group?.chatId || group?.remoteJid || "";

const getGroupName = (group) =>
  group?.name || group?.Name || group?.subject || group?.pushName || getGroupJid(group);

function WhatsappBotConfigPage() {
  const { config, loading, obtenerConfig, actualizarConfig } =
    useEmpresaConfig();
  const [status, setStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroupJid, setSelectedGroupJid] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [alertasWhatsapp, setAlertasWhatsapp] = useState(initialAlertasRules);
  const [savingAlertasWhatsapp, setSavingAlertasWhatsapp] = useState(false);
  const [test, setTest] = useState(initialTest);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    obtenerConfig().catch((error) => {
      notify.error(
        error.response?.data?.message ||
          "No se pudo cargar la configuración de WhatsApp"
      );
    });
  }, [obtenerConfig]);

  useEffect(() => {
    const groupJid = config?.whatsappGrupoOperacionesJid || "";
    setSelectedGroupJid(groupJid);

    setTest((prev) => ({
      ...prev,
      number: prev.number || groupJid,
    }));

    setAlertasWhatsapp({
      activo: config?.documentacionAlertasWhatsappActivo ?? true,
      hora: config?.documentacionAlertasWhatsappHora || "08:00",
      diasInicio: config?.documentacionAlertasWhatsappDiasInicio || 15,
      modoDiario: config?.documentacionAlertasWhatsappModoDiario ?? false,
      contenedoresHora:
        config?.contenedoresAlertasWhatsappHora || "08:15",
      contenedoresDiasInicio:
        config?.contenedoresAlertasWhatsappDiasInicio || 7,
      documentacion: config?.documentacionAlertasWhatsappActivo ?? true,
      ordenes: config?.ordenesAlertasWhatsappActivo ?? true,
      programaciones: config?.programacionesAlertasWhatsappActivo ?? true,
      contenedores: config?.contenedoresAlertasWhatsappActivo ?? true,
    });
  }, [config]);

  const consultarEstado = async () => {
    try {
      setCheckingStatus(true);
      const res = await obtenerWhatsappStatusRequest();
      setStatus(res.data || null);
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo consultar el estado de WhatsApp"
      );
    } finally {
      setCheckingStatus(false);
    }
  };

  const listarGrupos = async () => {
    try {
      setLoadingGroups(true);
      const res = await listarWhatsappGruposRequest();
      const nextGroups = Array.isArray(res.data?.groups) ? res.data.groups : [];
      setGroups(nextGroups);
      notify.success(`Se encontraron ${nextGroups.length} grupos`);
    } catch (error) {
      notify.error(
        error.response?.data?.message || "No se pudo listar grupos de WhatsApp"
      );
    } finally {
      setLoadingGroups(false);
    }
  };

  const guardarGrupo = async () => {
    try {
      setSavingGroup(true);
      const groupJid = selectedGroupJid.trim();
      await actualizarConfig({ whatsappGrupoOperacionesJid: groupJid });
      setTest((prev) => ({ ...prev, number: groupJid || prev.number }));
      notify.success("Grupo operativo de WhatsApp guardado");
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo guardar el grupo operativo de WhatsApp"
      );
    } finally {
      setSavingGroup(false);
    }
  };

  const guardarAlertasWhatsapp = async () => {
    try {
      setSavingAlertasWhatsapp(true);
      await actualizarConfig({
        documentacionAlertasWhatsappActivo: alertasWhatsapp.documentacion,
        documentacionAlertasWhatsappHora: alertasWhatsapp.hora,
        documentacionAlertasWhatsappDiasInicio:
          Number(alertasWhatsapp.diasInicio) || 15,
        documentacionAlertasWhatsappModoDiario:
          alertasWhatsapp.modoDiario,
        ordenesAlertasWhatsappActivo: alertasWhatsapp.ordenes,
        programacionesAlertasWhatsappActivo: alertasWhatsapp.programaciones,
        contenedoresAlertasWhatsappActivo: alertasWhatsapp.contenedores,
        contenedoresAlertasWhatsappHora: alertasWhatsapp.contenedoresHora,
        contenedoresAlertasWhatsappDiasInicio:
          Number(alertasWhatsapp.contenedoresDiasInicio) || 7,
      });
      notify.success("Alertas de WhatsApp guardadas");
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudieron guardar las alertas de WhatsApp"
      );
    } finally {
      setSavingAlertasWhatsapp(false);
    }
  };

  const enviarPrueba = async (event) => {
    event.preventDefault();

    try {
      setSendingTest(true);
      await enviarWhatsappPruebaRequest({
        number: test.number.trim(),
        text: test.text.trim(),
      });
      notify.success("Mensaje de prueba enviado");
    } catch (error) {
      notify.error(
        error.response?.data?.message ||
          "No se pudo enviar el mensaje de prueba"
      );
    } finally {
      setSendingTest(false);
    }
  };

  const usarGrupoConfigurado = () => {
    if (!selectedGroupJid) {
      notify.error("Primero selecciona o guarda un grupo operativo");
      return;
    }

    setTest((prev) => ({ ...prev, number: selectedGroupJid }));
  };

  const estadoActivo = status?.enabled && status?.configured;

  return (
    <div className="page">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="page-hero-content">
            <div>
              <div className="eyebrow">Administración</div>
              <h1 className="page-title">Configuración Bot WhatsApp</h1>
              <p className="page-description">
                Configura la conexión del bot, el grupo operativo y los envíos
                manuales de prueba.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] text-green-400">
              <MessageCircle className="h-6 w-6" />
            </div>
          </div>
        </header>

        {loading ? (
          <section className="loading-panel">
            <div className="loading-spinner" />
            <p className="text-muted text-sm">Cargando configuración...</p>
          </section>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <section className="panel p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-main text-base font-extrabold">
                      Estado de conexión
                    </h2>
                    <p className="text-muted mt-1 text-sm">
                      Verifica si el servicio de WhatsApp está habilitado y con
                      token configurado en el servidor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={consultarEstado}
                    disabled={checkingStatus}
                    className="btn-secondary gap-2 px-4 py-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        checkingStatus ? "animate-spin" : ""
                      }`}
                    />
                    {checkingStatus ? "Consultando..." : "Consultar estado"}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="info-tile">
                    <p className="text-faint text-xs font-bold uppercase">
                      Bot
                    </p>
                    <p className="text-main mt-1 text-sm font-extrabold">
                      {status ? (status.enabled ? "Habilitado" : "Inactivo") : "Sin consultar"}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="text-faint text-xs font-bold uppercase">
                      Token
                    </p>
                    <p className="text-main mt-1 text-sm font-extrabold">
                      {status
                        ? status.configured
                          ? "Configurado"
                          : "Pendiente"
                        : "Sin consultar"}
                    </p>
                  </div>
                  <div className="info-tile">
                    <p className="text-faint text-xs font-bold uppercase">
                      Estado operativo
                    </p>
                    <p
                      className={`mt-1 text-sm font-extrabold ${
                        estadoActivo ? "text-green-400" : "text-amber-400"
                      }`}
                    >
                      {status
                        ? estadoActivo
                          ? "Listo para usar"
                          : "Revisar configuración"
                        : "Sin consultar"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="panel p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-main text-base font-extrabold">
                      Grupo operativo
                    </h2>
                    <p className="text-muted mt-1 text-sm">
                      Guarda el grupo donde el sistema enviará avisos
                      operativos cuando se activen los envíos automáticos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={listarGrupos}
                    disabled={loadingGroups}
                    className="btn-secondary gap-2 px-4 py-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loadingGroups ? "animate-spin" : ""
                      }`}
                    />
                    {loadingGroups ? "Listando..." : "Listar grupos"}
                  </button>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="space-y-1">
                    <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                      Grupo seleccionado
                    </span>
                    <select
                      value={selectedGroupJid}
                      onChange={(event) => setSelectedGroupJid(event.target.value)}
                      className="input"
                    >
                      <option value="">Sin grupo configurado</option>
                      {groups.map((group) => {
                        const jid = getGroupJid(group);
                        if (!jid) return null;

                        return (
                          <option key={jid} value={jid}>
                            {getGroupName(group)} - {jid}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                      JID del grupo
                    </span>
                    <input
                      value={selectedGroupJid}
                      onChange={(event) => setSelectedGroupJid(event.target.value)}
                      className="input"
                      placeholder="120363000000000000@g.us"
                    />
                  </label>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={guardarGrupo}
                      disabled={savingGroup}
                      className="btn-primary gap-2 px-4 py-2"
                    >
                      <Save className="h-4 w-4" />
                      {savingGroup ? "Guardando..." : "Guardar grupo"}
                    </button>
                  </div>
                </div>
              </section>

              <section className="panel p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-main flex items-center gap-2 text-base font-extrabold">
                      <BellRing className="h-4 w-4 text-amber-300" />
                      Alertas automáticas
                    </h2>
                    <p className="text-muted mt-1 text-sm">
                      La documentación es programada; órdenes y viajes son alertas por evento.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={guardarAlertasWhatsapp}
                    disabled={savingAlertasWhatsapp}
                    className="btn-primary gap-2 px-4 py-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingAlertasWhatsapp ? "Guardando..." : "Guardar alertas"}
                  </button>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-main text-sm font-extrabold">
                          Alerta programada
                        </p>
                        <p className="text-muted text-xs">
                          Se envía por vencimientos según horario y días de anticipación.
                        </p>
                      </div>
                      <span className="status-badge border-amber-500/30 bg-amber-500/10 text-amber-300">
                        Programada
                      </span>
                    </div>

                    <label className="info-tile flex cursor-pointer items-start justify-between gap-4 text-sm transition hover:border-[var(--app-primary)]">
                      <div>
                        <p className="text-main font-semibold">
                          Documentación
                        </p>
                        <p className="text-muted mt-1 text-xs leading-5">
                          Resumen automático de documentos por vencer.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertasWhatsapp.documentacion}
                        onChange={(event) =>
                          setAlertasWhatsapp((prev) => ({
                            ...prev,
                            documentacion: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 shrink-0"
                        aria-label="Activar alerta de documentación"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                          Hora de envío
                        </span>
                        <input
                          type="time"
                          value={alertasWhatsapp.contenedoresHora}
                          onChange={(event) =>
                            setAlertasWhatsapp((prev) => ({
                              ...prev,
                              contenedoresHora: event.target.value,
                            }))
                          }
                          className="input"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                          Alertar desde
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={alertasWhatsapp.contenedoresDiasInicio}
                          onChange={(event) =>
                            setAlertasWhatsapp((prev) => ({
                              ...prev,
                              contenedoresDiasInicio: event.target.value,
                            }))
                          }
                          className="input"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                      <label className="info-tile flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={alertasWhatsapp.modoDiario}
                          onChange={(event) =>
                            setAlertasWhatsapp((prev) => ({
                              ...prev,
                              modoDiario: event.target.checked,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-main font-semibold">
                          Repetir diario
                        </span>
                      </label>

                      <div className="info-tile text-sm">
                        <p className="text-main font-bold">
                          Regla de documentación
                        </p>
                        <p className="text-muted mt-1">
                          {alertasWhatsapp.modoDiario
                            ? `Desde ${alertasWhatsapp.diasInicio || 15} días antes, todos los días hasta el vencimiento.`
                            : `Hitos principales hasta ${alertasWhatsapp.diasInicio || 15} días antes.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-main text-sm font-extrabold">
                          Alertas por evento
                        </p>
                        <p className="text-muted text-xs">
                          Se envían una vez por cada creación registrada.
                        </p>
                      </div>
                      <span className="status-badge border-sky-500/30 bg-sky-500/10 text-sky-300">
                        Inmediatas
                      </span>
                    </div>

                    {[
                      {
                        key: "ordenes",
                        title: "Creación de órdenes",
                        detail: "Notificación al registrar una nueva orden de servicio.",
                      },
                      {
                        key: "programaciones",
                        title: "Creación de viajes",
                        detail: "Notificación al crear una nueva programación de viaje.",
                      },
                    ].map((item) => {
                      const checked = alertasWhatsapp[item.key];

                      return (
                        <label
                          key={item.key}
                          className="info-tile flex cursor-pointer flex-col gap-3 text-sm transition hover:border-[var(--app-primary)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-main font-semibold">
                                {item.title}
                              </p>
                              <p className="text-muted mt-1 text-xs leading-5">
                                {item.detail}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                setAlertasWhatsapp((prev) => ({
                                  ...prev,
                                  [item.key]: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 shrink-0"
                              aria-label={`Activar alerta de ${item.title.toLowerCase()}`}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-faint text-xs uppercase tracking-wide">
                              Estado actual
                            </span>
                            <span
                              className={`status-badge ${
                                checked
                                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                                  : "border-red-500/30 bg-red-500/10 text-red-300"
                              }`}
                            >
                              {checked ? "Activa" : "Desactivada"}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-main text-sm font-extrabold">
                          Contenedores próximos a vencer
                        </p>
                        <p className="text-muted text-xs">
                          Envío automático diario para contenedores con
                          devolución cercana.
                        </p>
                      </div>
                      <span className="status-badge border-violet-500/30 bg-violet-500/10 text-violet-300">
                        {`${alertasWhatsapp.contenedoresDiasInicio || 7} días`}
                      </span>
                    </div>

                    <label className="info-tile flex cursor-pointer items-start justify-between gap-4 text-sm transition hover:border-[var(--app-primary)]">
                      <div>
                        <p className="text-main font-semibold">
                          Activar alerta
                        </p>
                        <p className="text-muted mt-1 text-xs leading-5">
                          Resumen diario de contenedores por vencer.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertasWhatsapp.contenedores}
                        onChange={(event) =>
                          setAlertasWhatsapp((prev) => ({
                            ...prev,
                            contenedores: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 shrink-0"
                        aria-label="Activar alerta de contenedores próximos a vencer"
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                          Hora de envío
                        </span>
                        <input
                          type="time"
                          value={alertasWhatsapp.hora}
                          onChange={(event) =>
                            setAlertasWhatsapp((prev) => ({
                              ...prev,
                              hora: event.target.value,
                            }))
                          }
                          className="input"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                          Alertar desde
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={alertasWhatsapp.diasInicio}
                          onChange={(event) =>
                            setAlertasWhatsapp((prev) => ({
                              ...prev,
                              diasInicio: event.target.value,
                            }))
                          }
                          className="input"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="panel p-5 sm:p-6">
              <h2 className="text-main text-base font-extrabold">
                Mensaje de prueba
              </h2>
              <p className="text-muted mt-1 text-sm">
                Envía un mensaje manual a un número peruano o al grupo
                operativo configurado.
              </p>

              <form onSubmit={enviarPrueba} className="mt-5 space-y-4">
                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    Destino
                  </span>
                  <input
                    value={test.number}
                    onChange={(event) =>
                      setTest((prev) => ({
                        ...prev,
                        number: event.target.value,
                      }))
                    }
                    className="input"
                    placeholder="51999999999 o grupo@g.us"
                    required
                  />
                </label>

                <button
                  type="button"
                  onClick={usarGrupoConfigurado}
                  className="btn-secondary w-full px-4 py-2"
                >
                  Usar grupo configurado
                </button>

                <label className="space-y-1">
                  <span className="text-muted text-xs font-semibold uppercase tracking-wide">
                    Mensaje
                  </span>
                  <textarea
                    value={test.text}
                    onChange={(event) =>
                      setTest((prev) => ({ ...prev, text: event.target.value }))
                    }
                    className="input min-h-[140px]"
                    maxLength={1000}
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={sendingTest}
                  className="btn-primary w-full gap-2 px-4 py-2"
                >
                  <Send className="h-4 w-4" />
                  {sendingTest ? "Enviando..." : "Enviar prueba"}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsappBotConfigPage;

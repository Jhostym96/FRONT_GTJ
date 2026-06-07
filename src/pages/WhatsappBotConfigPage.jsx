import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Save, Send } from "lucide-react";
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
    <div className="w-full py-4">
      <div className="page-wrap">
        <header className="page-hero">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
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
          <section className="panel p-8 text-center">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-green-500" />
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

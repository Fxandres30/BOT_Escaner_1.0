// @ts-nocheck
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config();

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";

import { guardarUsuario } from "./functions/guardarUsuario.js";

console.log("🚀 BOT ESCÁNER INICIADO");

let sock;
let starting = false;

const gruposCache = {};

async function startBot() {

  if (starting) return;
  starting = true;

  try {

    const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      version,
      browser: ["Windows", "Chrome", "10"],
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 Escanea el QR");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {

        console.log("✅ CONECTADO A WHATSAPP");
        starting = false;

        // 🔎 escaneo inicial al conectar
        setTimeout(escanearGrupos, 5000);

      }

      if (connection === "close") {

        const statusCode =
          new Boom(lastDisconnect?.error)?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {

          console.log("🚫 Sesión cerrada");
          process.exit(1);

        }

        starting = false;
        setTimeout(startBot, 5000);

      }

    });

    // 📩 MENSAJES
    sock.ev.on("messages.upsert", async ({ messages }) => {

      for (const msg of messages) {

        if (!msg?.key) continue;

        const grupoId = msg.key.remoteJid;

        if (!grupoId?.endsWith("@g.us")) continue;

        if (!gruposCache[grupoId]) {

          try {

            const metadata = await sock.groupMetadata(grupoId);

            gruposCache[grupoId] = metadata.subject;

          } catch {

            gruposCache[grupoId] = "grupo_desconocido";

          }

        }

        const grupoNombre = gruposCache[grupoId];

        const lid = msg?.key?.participant || null;

        const nombre = msg?.pushName || null;

        const telefonoRaw = msg?.key?.participantPn || null;

        const telefono = telefonoRaw
          ? telefonoRaw.split("@")[0]
          : null;

        console.log("📌 Grupo:", grupoNombre);
        console.log("👤 Usuario:", nombre);
        console.log("🆔 LID:", lid);
        console.log("📞 Teléfono:", telefono);
        console.log("----------------------");

        if (lid) {

          await guardarUsuario({
            lid,
            telefono,
            nombre,
            grupo_id: grupoId,
            grupo_nombre: grupoNombre
          });

        }

      }

    });

  } catch (err) {

    console.error("❌ Error crítico:", err);

    starting = false;

    setTimeout(startBot, 5000);

  }

}

// 🔎 ESCANEO DE GRUPOS
async function escanearGrupos() {

  console.log("🔎 Iniciando escaneo de grupos...");

  for (const grupoId of Object.keys(gruposCache)) {

    try {

      const metadata = await sock.groupMetadata(grupoId);

      const grupoNombre = metadata.subject;

      console.log("📌 Escaneando:", grupoNombre);

      for (const participante of metadata.participants) {

        const lid = participante.id;

        await guardarUsuario({
          lid,
          telefono: null,
          nombre: null,
          grupo_id: grupoId,
          grupo_nombre: grupoNombre
        });

      }

    } catch (err) {

      console.log("❌ Error escaneando grupo:", err.message);

    }

  }

}

// ⏰ ESCANEO AUTOMÁTICO CADA 6 HORAS
setInterval(() => {

  escanearGrupos();

}, 6 * 60 * 60 * 1000);

startBot();
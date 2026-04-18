// @ts-nocheck
import "dotenv/config";

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";

import { guardarUsuario } from "./functions/guardarUsuario.js";
import { escanearGrupos } from "./functions/escanearGrupo.js";

console.log("🚀 BOT ESCÁNER INICIADO");

let sock;
let starting = false;

// ================= 🚀 BOT =================

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

        // 🔥 ESCANEO INICIAL
        setTimeout(() => escanearGrupos(sock), 5000);
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

   // ================= 📩 MENSAJES (TIEMPO REAL) =================

sock.ev.on("messages.upsert", async ({ messages }) => {

  for (const msg of messages) {

    if (!msg?.key) continue;
    if (msg.key.fromMe) continue;

    const grupoId = msg.key.remoteJid;
    if (!grupoId?.endsWith("@g.us")) continue;

    const jid = msg?.key?.participant || null;

    let lid = null;
    let telefono = null;

    if (jid?.endsWith("@s.whatsapp.net")) {
      telefono = jid.split("@")[0];
      lid = jid;
    }

    if (jid?.endsWith("@lid")) {
      lid = jid;
    }

    if (msg?.key?.participantPn) {
      telefono = msg.key.participantPn.split("@")[0];
    }

    const nombre = msg?.pushName || null;

    console.log("👤", nombre, "| 🆔", lid, "| 📞", telefono);

    if (lid || telefono) {
      await guardarUsuario({
        lid,
        telefono,
        nombre
      });
    }

  }

}); // ✅ cierre evento

  } catch (err) {

    console.error("❌ Error crítico:", err);
    starting = false;
    setTimeout(startBot, 5000);

  }

} // ✅ cierre de startBot

// ================= 🔎 ESCÁNER AUTOMÁTICO =================

// 🔁 cada 6 horas
setInterval(() => {
  if (sock) escanearGrupos(sock);
}, 6 * 60 * 60 * 1000);

// 🚀 START
startBot();
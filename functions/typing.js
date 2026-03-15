export async function delayEscritura(sock, jid, min = 3000, max = 5000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;

  await sock.sendPresenceUpdate("composing", jid);
  await new Promise(r => setTimeout(r, ms));
  await sock.sendPresenceUpdate("paused", jid);
}

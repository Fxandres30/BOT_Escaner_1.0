import { guardarUsuario } from "./guardarUsuario.js";

async function escanearGrupos() {

  console.log("🔎 Iniciando escaneo real de grupos...");

  const grupos = await sock.groupFetchAllParticipating();

  for (const grupoId in grupos) {

    const grupo = grupos[grupoId];

    console.log("📌 Escaneando:", grupo.subject);

    for (const participante of grupo.participants) {

      const lid = participante.id;

      await guardarUsuario({
        lid,
        telefono: null,
        nombre: null,
        grupo_id: grupoId,
        grupo_nombre: grupo.subject
      });

    }

  }

}
import { supabase } from "./supabase.js"
import { guardarUsuario } from "./guardarUsuario.js"

// ================= NORMALIZAR TELÉFONO =================

function limpiarTelefono(numero) {
  if (!numero) return null

  let num = numero.replace(/\D/g, "") // solo números

  // 🇨🇴 Colombia → quitar 57 si tiene 12 dígitos
  if (num.startsWith("57") && num.length === 12) {
    num = num.slice(2)
  }

  // validar que quede de 10 dígitos
  if (num.length !== 10) return null

  return num
}

// ================= EXTRAER =================

function extraerDeObjeto(obj) {
  let lid = null
  let telefono = null

  const revisar = (data) => {
    if (!data) return

    if (typeof data === "string") {

      if (data.includes("@lid") && !lid) {
        lid = data
      }

      if (data.includes("@s.whatsapp.net") && !telefono) {
        const raw = data.split("@")[0]
        telefono = limpiarTelefono(raw)
      }

    }

    if (typeof data === "object" && data !== null) {
      for (const key in data) {
        revisar(data[key])
      }
    }
  }

  revisar(obj)

  return { lid, telefono }
}

// ================= ESCÁNER =================
export async function escanearGrupos(sock) {

  console.log("🚀 ESCÁNER PRO iniciado...")

  const grupos = await sock.groupFetchAllParticipating()

  let total = 0
  let lote = []

  // 🔥 CONFIG
  const TAM_LOTE = 30
  const CONCURRENCIA = 9

  // ================= RETRY =================
  async function withRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn()
      } catch (err) {
        if (i === retries - 1) {
          console.log("❌ ERROR FINAL:", err.message)
          return
        }
        console.log(`🔁 Reintentando... (${i + 1})`)
        await new Promise(r => setTimeout(r, 400))
      }
    }
  }

  // ================= PROCESAR LOTE =================
  async function procesarLote(lote) {

    console.log(`📦 Procesando lote de ${lote.length}`)

    for (let i = 0; i < lote.length; i += CONCURRENCIA) {

      const grupo = lote.slice(i, i + CONCURRENCIA)

      await Promise.all(
        grupo.map(user =>
          withRetry(() => guardarUsuario(user))
        )
      )

    }
  }

  // ================= RECORRER =================
  for (const grupoId in grupos) {

    const grupo = grupos[grupoId]
    console.log("📌 Grupo:", grupo.subject)

    for (const participante of grupo.participants) {

      try {

        const { lid, telefono } = extraerDeObjeto(participante)

        if (!lid && !telefono) continue

        lote.push({
          lid: lid || null,
          telefono: telefono || null,
          nombre: participante?.name || participante?.notify || null
        })

        total++

        // 🔥 cuando llena lote
        if (lote.length >= TAM_LOTE) {
          await procesarLote(lote)
          lote = []
        }

      } catch (err) {
        console.log("⚠️ Error participante", err.message)
      }

    }

  }

  // 🔥 último lote
  if (lote.length > 0) {
    await procesarLote(lote)
  }

  console.log(`🔥 TOTAL ESCANEADO: ${total}`)
}
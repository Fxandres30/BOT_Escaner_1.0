import { supabase } from "./supabase.js"

// ================= LIMPIAR TEL =================

function limpiarTelefono(numero) {
  if (!numero) return null

  let limpio = numero.replace(/\D/g, "")

  // 🇨🇴 quitar 57
  if (limpio.startsWith("57") && limpio.length === 12) {
    limpio = limpio.slice(2)
  }

  // validar celular colombiano
  if (limpio.length !== 10) return null
  if (!limpio.startsWith("3")) return null

  return limpio
}

// ================= GUARDAR =================

export async function guardarUsuario({ lid, telefono, nombre }) {
  try {

    const telefonoLimpio = limpiarTelefono(telefono)

    let usuario = null

    // ================= 🔍 BUSCAR POR LID =================
    if (lid) {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("lid", lid)
        .maybeSingle()

      if (error) {
        console.log(`❌ DB ERROR | buscar lid | ${lid} | ${error.message}`)
        return
      }

      if (data) usuario = data
    }

    // ================= 🔍 BUSCAR POR TEL =================
    if (!usuario && telefonoLimpio) {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("telefono", telefonoLimpio)
        .maybeSingle()

      if (error) {
        console.log(`❌ DB ERROR | buscar tel | ${telefonoLimpio} | ${error.message}`)
        return
      }

      if (data) usuario = data
    }

    // ================= 🆕 NUEVO =================
    if (!usuario) {

      await supabase
        .from("usuarios")
        .insert({
          lid: lid || null,
          telefono: telefonoLimpio || null,
          nombre: nombre || null,
          created_at: new Date(),
          ultima_actividad: new Date()
        })

      console.log(
        `🆕 NUEVO | 👤 ${nombre || "sin_nombre"} | 🆔 ${lid} | 📞 ${telefonoLimpio || "null"}`
      )

      return
    }

    // ================= 🔄 UNIFICAR =================

    let update = {
      ultima_actividad: new Date()
    }

    let cambios = false

    // 🔥 agregar lid si no existe
    if (!usuario.lid && lid) {
      update.lid = lid
      cambios = true
      console.log(`🔗 LID AGREGADO | ${lid}`)
    }

    // 🔥 agregar teléfono si no existe
    if (!usuario.telefono && telefonoLimpio) {
      update.telefono = telefonoLimpio
      cambios = true
      console.log(`📱 TEL AGREGADO | ${telefonoLimpio}`)
    }

    // 🔥 actualizar nombre si no existe
    if (!usuario.nombre && nombre) {
      update.nombre = nombre
      cambios = true
      console.log(`✏️ NOMBRE AGREGADO | ${nombre}`)
    }

    // ================= UPDATE =================

    await supabase
      .from("usuarios")
      .update(update)
      .eq("id", usuario.id)

    console.log(
      cambios
        ? `✅ MERGE | ${usuario.id}`
        : `🔄 ACTIVO | ${usuario.id}`
    )

  } catch (err) {
    console.log(`❌ ERROR GLOBAL | ${lid} | ${err.message}`)
  }
}
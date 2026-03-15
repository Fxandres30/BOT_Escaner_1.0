import { supabase } from "./supabase.js";

function limpiarTelefono(numero) {
  if (!numero) return null;

  numero = numero.replace(/\D/g, "");

  if (numero.startsWith("57") && numero.length === 12) {
    numero = numero.substring(2);
  }

  return numero;
}

export async function guardarUsuario(data) {

  const { lid, telefono, nombre, grupo_id, grupo_nombre } = data;

  if (!lid) return;

  const telefonoLimpio = limpiarTelefono(telefono);

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("lid", lid)
    .maybeSingle();

  // 🔹 Usuario nuevo
  if (!usuario) {

    const { error } = await supabase
      .from("usuarios")
      .insert({
        lid,
        telefono: telefonoLimpio,
        nombre,
        grupo_id,
        grupo_nombre,
        ultima_actividad: new Date()
      });

    if (error) {
      console.log("❌ Error guardando:", error.message);
    } else {
      console.log("✅ Usuario nuevo:", nombre);
    }

    return;
  }

  // 🔹 Usuario existente
  const updateData = {
    nombre,
    grupo_nombre,
    ultima_actividad: new Date()
  };

  // solo guardar teléfono si aún no existe
  if (!usuario.telefono && telefonoLimpio) {
    updateData.telefono = telefonoLimpio;
  }

  const { error } = await supabase
    .from("usuarios")
    .update(updateData)
    .eq("lid", lid);

  if (error) {
    console.log("❌ Error actualizando:", error.message);
  }

}
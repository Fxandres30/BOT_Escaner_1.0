export async function obtenerStats(supabase) {

  const ahora = new Date();
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { count: total } = await supabase
    .from("usuarios_whatsapp")
    .select("*", { count: "exact", head: true });

  const { count: conTelefono } = await supabase
    .from("usuarios_whatsapp")
    .select("*", { count: "exact", head: true })
    .not("telefono", "is", null);

  const { count: sinTelefono } = await supabase
    .from("usuarios_whatsapp")
    .select("*", { count: "exact", head: true })
    .is("telefono", null);

  const { count: conNombre } = await supabase
    .from("usuarios_whatsapp")
    .select("*", { count: "exact", head: true })
    .not("nombre", "is", null);

  const { count: activos24h } = await supabase
    .from("usuarios_whatsapp")
    .select("*", { count: "exact", head: true })
    .gte("ultima_actividad", hace24h.toISOString());

  const { count: completos } = await supabase
    .from("usuarios_whatsapp")
    .select("*", { count: "exact", head: true })
    .not("telefono", "is", null)
    .not("nombre", "is", null);

  const porcentajeTel = ((conTelefono / total) * 100).toFixed(2);

  return {
    total,
    conTelefono,
    sinTelefono,
    conNombre,
    activos24h,
    completos,
    porcentajeTel
  };
}
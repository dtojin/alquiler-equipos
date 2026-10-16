
// Reglas de negocio (única fuente de verdad en el servidor).
// Las fechas son strings 'YYYY-MM-DD'.

export function diasEntre(desde, hasta) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86400000);
}

// Días a cobrar: diferencia entre inicio y devolución; mínimo 1 día.
export function diasAlquiler(inicio, fin) {
  return Math.max(1, diasEntre(inicio, fin));
}

export function costoBase(tarifaDiaria, dias) {
  return round2(tarifaDiaria * dias);
}

// Cargo por atraso:
//  - 'dia'    -> días de atraso × recargo por día
//  - 'semana' -> semanas de atraso (se redondea hacia arriba) × recargo por semana
export function cargoExtra(diasRetraso, tipo, recargoUnitario) {
  if (diasRetraso <= 0) return 0;
  const unidades = tipo === 'semana' ? Math.ceil(diasRetraso / 7) : diasRetraso;
  return round2(unidades * recargoUnitario);
}

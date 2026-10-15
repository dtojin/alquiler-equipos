// Mismas reglas que backend/calculos.js (el servidor siempre recalcula y es quien manda).
export const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const diasAlquiler = (inicio, fin) => Math.max(1, diasEntre(inicio, fin));
export const cargoExtra = (diasRetraso, tipo, unit) =>
  diasRetraso <= 0 ? 0 : (tipo === 'semana' ? Math.ceil(diasRetraso / 7) : diasRetraso) * unit;

export const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
export const money = (n) => fmt.format(n ?? 0);

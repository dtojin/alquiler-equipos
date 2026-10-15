import express from 'express';
import cors from 'cors';
import db from './db.js';
import { diasAlquiler, costoBase, cargoExtra, diasEntre, hoy, round2 } from './calculos.js';

const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res) => {
  try { fn(req, res); }
  catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Ya existe un cliente con ese documento.' });
    console.error(e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

/* ---------------- EQUIPOS ---------------- */
app.get('/api/equipos', wrap((req, res) => {
  const { estado } = req.query;
  const rows = estado
    ? db.prepare('SELECT * FROM equipos WHERE estado = ? ORDER BY nombre').all(estado)
    : db.prepare('SELECT * FROM equipos ORDER BY nombre').all();
  res.json(rows);
}));

function validarEquipo(b) {
  if (!b.nombre?.trim()) return 'El nombre es obligatorio.';
  if (!(Number(b.tarifa_diaria) > 0)) return 'La tarifa diaria debe ser mayor que 0.';
  if (Number(b.recargo_dia) < 0 || Number(b.recargo_semana) < 0) return 'Los recargos no pueden ser negativos.';
  return null;
}

app.post('/api/equipos', wrap((req, res) => {
  const b = req.body, err = validarEquipo(b);
  if (err) return bad(res, err);
  const r = db.prepare(
    'INSERT INTO equipos (nombre, descripcion, tarifa_diaria, recargo_dia, recargo_semana, foto_url) VALUES (?,?,?,?,?,?)'
  ).run(b.nombre.trim(), b.descripcion || '', b.tarifa_diaria, b.recargo_dia || 0, b.recargo_semana || 0, b.foto_url || '');
  res.status(201).json(db.prepare('SELECT * FROM equipos WHERE id = ?').get(r.lastInsertRowid));
}));

app.put('/api/equipos/:id', wrap((req, res) => {
  const b = req.body, err = validarEquipo(b);
  if (err) return bad(res, err);
  const actual = db.prepare('SELECT estado FROM equipos WHERE id = ?').get(req.params.id);
  if (!actual) return bad(res, 'Equipo no encontrado.', 404);
  // "alquilado" solo lo controla el módulo de alquileres (al alquilar / devolver)
  let estado = actual.estado;
  if (actual.estado !== 'alquilado' && ['disponible', 'mantenimiento'].includes(b.estado)) estado = b.estado;
  db.prepare(
    'UPDATE equipos SET nombre=?, descripcion=?, tarifa_diaria=?, recargo_dia=?, recargo_semana=?, estado=?, foto_url=? WHERE id=?'
  ).run(b.nombre.trim(), b.descripcion || '', b.tarifa_diaria, b.recargo_dia || 0, b.recargo_semana || 0, estado, b.foto_url || '', req.params.id);
  res.json(db.prepare('SELECT * FROM equipos WHERE id = ?').get(req.params.id));
}));

app.delete('/api/equipos/:id', wrap((req, res) => {
  const usado = db.prepare('SELECT COUNT(*) AS n FROM alquileres WHERE equipo_id = ?').get(req.params.id).n;
  if (usado) return bad(res, 'No se puede eliminar: el equipo tiene alquileres en su historial. Póngalo en mantenimiento.', 409);
  db.prepare('DELETE FROM equipos WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

/* ---------------- CLIENTES ---------------- */
app.get('/api/clientes', wrap((req, res) => {
  res.json(db.prepare('SELECT * FROM clientes ORDER BY nombre').all());
}));

app.post('/api/clientes', wrap((req, res) => {
  const b = req.body;
  if (!b.nombre?.trim() || !b.documento?.trim()) return bad(res, 'Nombre y documento (DNI/RUC) son obligatorios.');
  const r = db.prepare('INSERT INTO clientes (nombre, documento, telefono, email, direccion) VALUES (?,?,?,?,?)')
    .run(b.nombre.trim(), b.documento.trim(), b.telefono || '', b.email || '', b.direccion || '');
  res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(r.lastInsertRowid));
}));

app.put('/api/clientes/:id', wrap((req, res) => {
  const b = req.body;
  if (!b.nombre?.trim() || !b.documento?.trim()) return bad(res, 'Nombre y documento (DNI/RUC) son obligatorios.');
  db.prepare('UPDATE clientes SET nombre=?, documento=?, telefono=?, email=?, direccion=? WHERE id=?')
    .run(b.nombre.trim(), b.documento.trim(), b.telefono || '', b.email || '', b.direccion || '', req.params.id);
  res.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
}));

app.delete('/api/clientes/:id', wrap((req, res) => {
  const usado = db.prepare('SELECT COUNT(*) AS n FROM alquileres WHERE cliente_id = ?').get(req.params.id).n;
  if (usado) return bad(res, 'No se puede eliminar: el cliente tiene alquileres en su historial.', 409);
  db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
  res.status(204).end();
}));

/* ---------------- ALQUILERES ---------------- */
const SELECT_ALQ = `
  SELECT a.*, e.nombre AS equipo_nombre, c.nombre AS cliente_nombre
  FROM alquileres a
  JOIN equipos e ON e.id = a.equipo_id
  JOIN clientes c ON c.id = a.cliente_id`;

// Para alquileres activos vencidos, calcula el cargo acumulado hasta hoy
function conAtrasoActual(a) {
  if (a.estado !== 'activo') return a;
  const retraso = Math.max(0, diasEntre(a.fecha_devolucion_estimada, hoy()));
  return { ...a, dias_retraso_actual: retraso, cargo_extra_actual: cargoExtra(retraso, a.tipo_recargo, a.recargo_unitario) };
}

app.get('/api/alquileres', wrap((req, res) => {
  const { cliente_id, equipo_id, estado } = req.query;
  const where = [], params = [];
  if (cliente_id) { where.push('a.cliente_id = ?'); params.push(cliente_id); }
  if (equipo_id)  { where.push('a.equipo_id = ?');  params.push(equipo_id); }
  if (estado)     { where.push('a.estado = ?');     params.push(estado); }
  const sql = SELECT_ALQ + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY a.id DESC';
  res.json(db.prepare(sql).all(...params).map(conAtrasoActual));
}));

app.post('/api/alquileres', wrap((req, res) => {
  const { equipo_id, cliente_id, fecha_inicio, fecha_devolucion_estimada, tipo_recargo } = req.body;
  if (!equipo_id || !cliente_id || !fecha_inicio || !fecha_devolucion_estimada) return bad(res, 'Complete equipo, cliente y fechas.');
  if (!['dia', 'semana'].includes(tipo_recargo)) return bad(res, 'Elija el tipo de recargo por atraso (día o semana).');
  if (fecha_devolucion_estimada < fecha_inicio) return bad(res, 'La fecha de devolución no puede ser anterior a la de inicio.');

  const crear = db.transaction(() => {
    const eq = db.prepare('SELECT * FROM equipos WHERE id = ?').get(equipo_id);
    if (!eq) throw Object.assign(new Error('Equipo no encontrado.'), { http: 404 });
    if (eq.estado !== 'disponible') throw Object.assign(new Error(`El equipo no está disponible (estado: ${eq.estado}).`), { http: 409 });
    if (!db.prepare('SELECT id FROM clientes WHERE id = ?').get(cliente_id)) throw Object.assign(new Error('Cliente no encontrado.'), { http: 404 });

    const dias = diasAlquiler(fecha_inicio, fecha_devolucion_estimada);
    const base = costoBase(eq.tarifa_diaria, dias);
    const unit = tipo_recargo === 'semana' ? eq.recargo_semana : eq.recargo_dia;
    const r = db.prepare(`INSERT INTO alquileres
      (equipo_id, cliente_id, fecha_inicio, fecha_devolucion_estimada, tarifa_diaria, dias_estimados, costo_base, tipo_recargo, recargo_unitario)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(equipo_id, cliente_id, fecha_inicio, fecha_devolucion_estimada, eq.tarifa_diaria, dias, base, tipo_recargo, unit);
    db.prepare("UPDATE equipos SET estado = 'alquilado' WHERE id = ?").run(equipo_id);
    return r.lastInsertRowid;
  });

  try {
    const id = crear();
    res.status(201).json(conAtrasoActual(db.prepare(SELECT_ALQ + ' WHERE a.id = ?').get(id)));
  } catch (e) {
    if (e.http) return bad(res, e.message, e.http);
    throw e;
  }
}));

app.post('/api/alquileres/:id/devolucion', wrap((req, res) => {
  const real = req.body.fecha_devolucion_real;
  if (!real) return bad(res, 'Indique la fecha real de devolución.');
  const a = db.prepare('SELECT * FROM alquileres WHERE id = ?').get(req.params.id);
  if (!a) return bad(res, 'Alquiler no encontrado.', 404);
  if (a.estado !== 'activo') return bad(res, 'Este alquiler ya fue devuelto.', 409);
  if (real < a.fecha_inicio) return bad(res, 'La devolución no puede ser anterior al inicio del alquiler.');

  const retraso = Math.max(0, diasEntre(a.fecha_devolucion_estimada, real));
  const extra = cargoExtra(retraso, a.tipo_recargo, a.recargo_unitario);
  const total = round2(a.costo_base + extra);

  db.transaction(() => {
    db.prepare(`UPDATE alquileres SET fecha_devolucion_real=?, dias_retraso=?, cargo_extra=?, total_cobrado=?, estado='devuelto' WHERE id=?`)
      .run(real, retraso, extra, total, a.id);
    db.prepare("UPDATE equipos SET estado = 'disponible' WHERE id = ?").run(a.equipo_id);
  })();
  res.json(db.prepare(SELECT_ALQ + ' WHERE a.id = ?').get(a.id));
}));

/* ---------------- DASHBOARD ---------------- */
app.get('/api/dashboard', wrap((req, res) => {
  const h = hoy();
  const count = (estado) => db.prepare('SELECT COUNT(*) AS n FROM equipos WHERE estado = ?').get(estado).n;
  const activos = db.prepare(SELECT_ALQ + " WHERE a.estado = 'activo' ORDER BY a.fecha_devolucion_estimada").all().map(conAtrasoActual);
  res.json({
    hoy: h,
    equipos_disponibles: count('disponible'),
    equipos_alquilados: count('alquilado'),
    equipos_mantenimiento: count('mantenimiento'),
    alquileres_activos: activos.length,
    devoluciones_hoy: activos.filter((a) => a.fecha_devolucion_estimada === h),
    devoluciones_vencidas: activos.filter((a) => a.fecha_devolucion_estimada < h),
  });
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API lista en http://localhost:${PORT}`));

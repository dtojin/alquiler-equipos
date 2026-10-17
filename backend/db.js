import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'alquileres.db'));
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8'));

// Datos de ejemplo la primera vez
if (db.prepare('SELECT COUNT(*) AS n FROM equipos').get().n === 0) {
  const ins = db.prepare(
    'INSERT INTO equipos (nombre, descripcion, tarifa_diaria, recargo_dia, recargo_semana, foto_url) VALUES (?,?,?,?,?,?)'
  );
  ins.run('Taladro percutor 800W', 'Taladro de impacto para concreto', 80, 120, 600, '');
  ins.run('Compresora 50L', 'Compresora de aire eléctrica', 150, 220, 1100, '');
  ins.run('Andamio tubular (juego)', 'Juego de 2 cuerpos con crucetas', 60, 90, 450, '');
  ins.run('Generador 5 kW', 'Generador a gasolina', 250, 380, 1800, '');
}

export default db;

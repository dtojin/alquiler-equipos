-- Esquema relacional: Sistema de Alquiler de Equipos de Construcción
-- (SQLite; es portable a MySQL/PostgreSQL cambiando AUTOINCREMENT por AUTO_INCREMENT/SERIAL)

CREATE TABLE IF NOT EXISTS equipos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT    NOT NULL,
  descripcion    TEXT,
  tarifa_diaria  REAL    NOT NULL CHECK (tarifa_diaria > 0),
  recargo_dia    REAL    NOT NULL DEFAULT 0 CHECK (recargo_dia >= 0),     -- cargo por cada día de atraso
  recargo_semana REAL    NOT NULL DEFAULT 0 CHECK (recargo_semana >= 0),  -- cargo por cada semana (o fracción) de atraso
  estado         TEXT    NOT NULL DEFAULT 'disponible'
                 CHECK (estado IN ('disponible','alquilado','mantenimiento')),
  foto_url       TEXT
);

CREATE TABLE IF NOT EXISTS clientes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT NOT NULL,
  documento  TEXT NOT NULL UNIQUE,   -- DNI / RUC
  telefono   TEXT,
  email      TEXT,
  direccion  TEXT
);

CREATE TABLE IF NOT EXISTS alquileres (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id                  INTEGER NOT NULL REFERENCES equipos(id),
  cliente_id                 INTEGER NOT NULL REFERENCES clientes(id),
  fecha_inicio               TEXT    NOT NULL,   -- YYYY-MM-DD
  fecha_devolucion_estimada  TEXT    NOT NULL,
  fecha_devolucion_real      TEXT,
  tarifa_diaria              REAL    NOT NULL,   -- copia de la tarifa al momento del alquiler
  dias_estimados             INTEGER NOT NULL,
  costo_base                 REAL    NOT NULL,   -- tarifa_diaria * dias_estimados (presupuesto)
  tipo_recargo               TEXT    NOT NULL CHECK (tipo_recargo IN ('dia','semana')),
  recargo_unitario           REAL    NOT NULL,   -- copia del recargo (por día o por semana)
  dias_retraso               INTEGER NOT NULL DEFAULT 0,
  cargo_extra                REAL    NOT NULL DEFAULT 0,
  total_cobrado              REAL,               -- costo_base + cargo_extra (al devolver)
  estado                     TEXT    NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','devuelto'))
);

CREATE INDEX IF NOT EXISTS idx_alq_equipo  ON alquileres(equipo_id);
CREATE INDEX IF NOT EXISTS idx_alq_cliente ON alquileres(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alq_estado  ON alquileres(estado);

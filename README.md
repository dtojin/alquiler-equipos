# Sistema de Alquiler de Equipos de Construcción

Aplicación web para registrar el inventario de equipos (taladros, compresoras, andamios, generadores),
gestionar alquileres y devoluciones, y saber en todo momento qué está disponible.

## Stack
| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Base de datos | SQLite (`better-sqlite3`), esquema en `database/schema.sql` |
| Control de versiones | Git — URL del repositorio: _(pegar aquí)_ |

## Arquitectura (organización del proyecto)
```
alquiler-equipos/
├── database/schema.sql        # tablas: equipos, clientes, alquileres
├── backend/
│   ├── server.js              # rutas REST (/api/equipos, /clientes, /alquileres, /dashboard)
│   ├── calculos.js            # reglas de negocio: total, días, recargo por atraso
│   └── db.js                  # conexión + datos de ejemplo
└── frontend/src/
    ├── App.jsx                # navegación
    ├── api.js, utils.js       # fetch y cálculos de vista previa
    └── pages/                 # Dashboard, Equipos, Clientes, Alquileres, Historial
```

## Cómo ejecutarlo
Terminal 1 (API, puerto 3001):
```
cd backend
npm install
npm start
```
Terminal 2 (web, puerto 5173):
```
cd frontend
npm install
npm run dev
```
Abrir http://localhost:5173

## Reglas de cálculo
- **Días a cobrar** = fecha estimada de devolución − fecha de inicio (mínimo 1 día).
- **Total del alquiler (presupuesto)** = días × tarifa diaria.
- **Recargo por atraso** (se elige al registrar el alquiler):
  - *Por día*: días de atraso × recargo por día del equipo.
  - *Por semana*: semanas de atraso (se redondea hacia arriba) × recargo por semana del equipo.
- **Total cobrado** = total del alquiler + recargo. Se calcula al registrar la devolución real.
- Al registrar un alquiler el equipo pasa a `alquilado`; al devolverlo vuelve a `disponible`.
- Las tarifas se guardan como copia en cada alquiler, así un cambio de precio no altera alquileres antiguos.

## Subir a Git
```
git init
git add .
git commit -m "Sistema de alquiler de equipos"
git branch -M main
git remote add origin <URL-del-repositorio>
git push -u origin main
```

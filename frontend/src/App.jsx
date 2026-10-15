import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Equipos from './pages/Equipos.jsx';
import Clientes from './pages/Clientes.jsx';
import Alquileres from './pages/Alquileres.jsx';
import Historial from './pages/Historial.jsx';

const SECCIONES = [
  ['dashboard', 'Panel', Dashboard],
  ['alquileres', 'Alquileres', Alquileres],
  ['equipos', 'Equipos', Equipos],
  ['clientes', 'Clientes', Clientes],
  ['historial', 'Historial', Historial],
];

export default function App() {
  const [seccion, setSeccion] = useState('dashboard');
  const Pagina = SECCIONES.find(([id]) => id === seccion)[2];

  return (
    <div className="layout">
      <nav className="sidebar" aria-label="Principal">
        <div className="marca">Equipos<br />de obra</div>
        <ul>
          {SECCIONES.map(([id, nombre]) => (
            <li key={id}>
              <button className={id === seccion ? 'activo' : ''} onClick={() => setSeccion(id)}>
                {nombre}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="contenido">
        <Pagina irA={setSeccion} />
      </main>
    </div>
  );
}

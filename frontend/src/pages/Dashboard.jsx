import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../utils.js';

function Lista({ titulo, items, vacio, vencidos }) {
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      {items.length === 0 ? <p className="vacio">{vacio}</p> : (
        <table>
          <thead><tr><th>Equipo</th><th>Cliente</th><th>Devolución prevista</th>{vencidos && <th>Atraso</th>}</tr></thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.equipo_nombre}</td>
                <td>{a.cliente_nombre}</td>
                <td>{a.fecha_devolucion_estimada}</td>
                {vencidos && <td className="peligro">{a.dias_retraso_actual} d · {money(a.cargo_extra_actual)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/dashboard').then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error">{error}</p>;
  if (!d) return <p>Cargando…</p>;

  return (
    <>
      <h1>Panel</h1>
      <div className="cifras">
        <div className="cifra"><span>{d.equipos_disponibles}</span>Disponibles hoy</div>
        <div className="cifra"><span>{d.alquileres_activos}</span>Alquileres activos</div>
        <div className="cifra"><span>{d.devoluciones_hoy.length}</span>Devoluciones de hoy</div>
        <div className={'cifra' + (d.devoluciones_vencidas.length ? ' alerta' : '')}>
          <span>{d.devoluciones_vencidas.length}</span>Con atraso
        </div>
      </div>
      <Lista titulo="Se devuelven hoy" items={d.devoluciones_hoy} vacio="No hay devoluciones previstas para hoy." />
      <Lista titulo="Con fecha vencida" items={d.devoluciones_vencidas} vacio="Ningún equipo está atrasado." vencidos />
    </>
  );
}

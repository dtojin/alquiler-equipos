import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../utils.js';

export default function Historial() {
  const [modo, setModo] = useState('cliente');
  const [opciones, setOpciones] = useState([]);
  const [id, setId] = useState('');
  const [filas, setFilas] = useState([]);

  useEffect(() => {
    setId(''); setFilas([]);
    api.get(modo === 'cliente' ? '/clientes' : '/equipos').then(setOpciones);
  }, [modo]);

  useEffect(() => {
    if (!id) return setFilas([]);
    api.get(`/alquileres?${modo}_id=${id}`).then(setFilas);
  }, [id, modo]);

  const cobrado = filas.reduce((s, a) => s + (a.total_cobrado || 0), 0);

  return (
    <>
      <h1>Historial de alquileres</h1>
      <section className="panel">
        <div className="filtros">
          <label>Ver por
            <select value={modo} onChange={(e) => setModo(e.target.value)}>
              <option value="cliente">Cliente</option>
              <option value="equipo">Equipo</option>
            </select>
          </label>
          <label>{modo === 'cliente' ? 'Cliente' : 'Equipo'}
            <select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">Seleccione…</option>
              {opciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </select>
          </label>
        </div>

        {!id ? <p className="vacio">Elija un {modo} para ver sus alquileres.</p>
          : filas.length === 0 ? <p className="vacio">Sin alquileres registrados.</p> : (
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>{modo === 'cliente' ? 'Equipo' : 'Cliente'}</th><th>Inicio</th><th>Devolución</th><th>Días</th><th>Atraso</th><th>Base</th><th>Extra</th><th>Cobrado</th></tr></thead>
              <tbody>
                {filas.map((a) => (
                  <tr key={a.id}>
                    <td>{modo === 'cliente' ? a.equipo_nombre : a.cliente_nombre}</td>
                    <td>{a.fecha_inicio}</td>
                    <td>{a.fecha_devolucion_real || <em>en curso</em>}</td>
                    <td>{a.dias_estimados}</td>
                    <td>{a.dias_retraso ? `${a.dias_retraso} d` : '—'}</td>
                    <td>{money(a.costo_base)}</td>
                    <td>{money(a.cargo_extra)}</td>
                    <td><strong>{a.total_cobrado != null ? money(a.total_cobrado) : '—'}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan="7">Total cobrado</td><td>{money(cobrado)}</td></tr></tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

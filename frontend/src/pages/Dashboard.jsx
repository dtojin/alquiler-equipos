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

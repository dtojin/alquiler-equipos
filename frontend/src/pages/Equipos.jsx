import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { money } from '../utils.js';

const VACIO = { nombre: '', descripcion: '', tarifa_diaria: '', recargo_dia: '', recargo_semana: '', estado: 'disponible', foto_url: '' };

export default function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState(null); // null = cerrado
  const [error, setError] = useState('');

  const cargar = () => api.get('/equipos').then(setEquipos).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, tarifa_diaria: Number(form.tarifa_diaria), recargo_dia: Number(form.recargo_dia || 0), recargo_semana: Number(form.recargo_semana || 0) };
      form.id ? await api.put(`/equipos/${form.id}`, body) : await api.post('/equipos', body);
      setForm(null);
      cargar();
    } catch (err) { setError(err.message); }
  }

  async function eliminar(eq) {
    if (!confirm(`¿Eliminar "${eq.nombre}"?`)) return;
    setError('');
    try { await api.del(`/equipos/${eq.id}`); cargar(); } catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="titulo-fila">
        <h1>Equipos</h1>
        {!form && <button className="primario" onClick={() => setForm(VACIO)}>Agregar equipo</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {form && (
        <form className="panel formulario" onSubmit={guardar}>
          <h2>{form.id ? 'Editar equipo' : 'Nuevo equipo'}</h2>
          <label>Nombre<input required value={form.nombre} onChange={set('nombre')} /></label>
          <label>Foto (URL de la imagen)<input value={form.foto_url} onChange={set('foto_url')} placeholder="https://…" /></label>
          <label className="ancho">Descripción<textarea rows="2" value={form.descripcion} onChange={set('descripcion')} /></label>
          <label>Tarifa diaria (Q)<input required type="number" min="0.01" step="0.01" value={form.tarifa_diaria} onChange={set('tarifa_diaria')} /></label>
          <label>Recargo por día de atraso (Q)<input type="number" min="0" step="0.01" value={form.recargo_dia} onChange={set('recargo_dia')} /></label>
          <label>Recargo por semana de atraso (Q)<input type="number" min="0" step="0.01" value={form.recargo_semana} onChange={set('recargo_semana')} /></label>
          <label>Estado
            <select value={form.estado} onChange={set('estado')} disabled={form.estado === 'alquilado'}>
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">En mantenimiento</option>
              {form.estado === 'alquilado' && <option value="alquilado">Alquilado (cambia al devolverlo)</option>}
            </select>
          </label>
          <div className="acciones ancho">
            <button className="primario" type="submit">Guardar equipo</button>
            <button type="button" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <section className="panel">
        {equipos.length === 0 ? <p className="vacio">Aún no hay equipos. Agregue el primero para empezar a alquilar.</p> : (
          <div className="tabla-scroll">
            <table>
              <thead><tr><th></th><th>Equipo</th><th>Tarifa diaria</th><th>Recargo / día</th><th>Recargo / semana</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {equipos.map((eq) => (
                  <tr key={eq.id}>
                    <td>{eq.foto_url ? <img className="mini" src={eq.foto_url} alt={eq.nombre} /> : <div className="mini sin-foto" />}</td>
                    <td><strong>{eq.nombre}</strong><br /><small>{eq.descripcion}</small></td>
                    <td>{money(eq.tarifa_diaria)}</td>
                    <td>{money(eq.recargo_dia)}</td>
                    <td>{money(eq.recargo_semana)}</td>
                    <td><span className={'estado ' + eq.estado}>{eq.estado}</span></td>
                    <td className="acciones">
                      <button onClick={() => setForm(eq)}>Editar</button>
                      <button className="peligro-btn" onClick={() => eliminar(eq)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api.js';

const VACIO = { nombre: '', documento: '', telefono: '', email: '', direccion: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const cargar = () => api.get('/clientes').then(setClientes).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      form.id ? await api.put(`/clientes/${form.id}`, form) : await api.post('/clientes', form);
      setForm(null);
      cargar();
    } catch (err) { setError(err.message); }
  }

  async function eliminar(c) {
    if (!confirm(`¿Eliminar a "${c.nombre}"?`)) return;
    setError('');
    try { await api.del(`/clientes/${c.id}`); cargar(); } catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="titulo-fila">
        <h1>Clientes</h1>
        {!form && <button className="primario" onClick={() => setForm(VACIO)}>Agregar cliente</button>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}

      {form && (
        <form className="panel formulario" onSubmit={guardar}>
          <h2>{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <label>Nombre o razón social<input required value={form.nombre} onChange={set('nombre')} /></label>
          <label>DNI / RUC<input required value={form.documento} onChange={set('documento')} /></label>
          <label>Teléfono<input value={form.telefono} onChange={set('telefono')} /></label>
          <label>Correo<input type="email" value={form.email} onChange={set('email')} /></label>
          <label className="ancho">Dirección de facturación<input value={form.direccion} onChange={set('direccion')} /></label>
          <div className="acciones ancho">
            <button className="primario" type="submit">Guardar cliente</button>
            <button type="button" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <section className="panel">
        {clientes.length === 0 ? <p className="vacio">Aún no hay clientes registrados.</p> : (
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>Nombre</th><th>DNI / RUC</th><th>Teléfono</th><th>Correo</th><th></th></tr></thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong><br /><small>{c.direccion}</small></td>
                    <td>{c.documento}</td><td>{c.telefono}</td><td>{c.email}</td>
                    <td className="acciones">
                      <button onClick={() => setForm(c)}>Editar</button>
                      <button className="peligro-btn" onClick={() => eliminar(c)}>Eliminar</button>
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

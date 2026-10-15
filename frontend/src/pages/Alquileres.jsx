import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { money, hoy, diasAlquiler, diasEntre, cargoExtra } from '../utils.js';

function Devolver({ alquiler, onListo }) {
  const [fecha, setFecha] = useState(hoy());
  const [error, setError] = useState('');
  const retraso = Math.max(0, diasEntre(alquiler.fecha_devolucion_estimada, fecha));
  const extra = cargoExtra(retraso, alquiler.tipo_recargo, alquiler.recargo_unitario);

  async function confirmar() {
    try { await api.post(`/alquileres/${alquiler.id}/devolucion`, { fecha_devolucion_real: fecha }); onListo(); }
    catch (e) { setError(e.message); }
  }

  return (
    <div className="devolver">
      <label>Fecha real de devolución<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
      <p>
        Atraso: <strong>{retraso} día(s)</strong> · Cargo extra: <strong>{money(extra)}</strong> · Total a cobrar: <strong>{money(alquiler.costo_base + extra)}</strong>
      </p>
      {error && <p className="error">{error}</p>}
      <button className="primario" onClick={confirmar}>Registrar devolución</button>
    </div>
  );
}

export default function Alquileres() {
  const [equipos, setEquipos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [alquileres, setAlquileres] = useState([]);
  const [f, setF] = useState({ equipo_id: '', cliente_id: '', fecha_inicio: hoy(), fecha_devolucion_estimada: hoy(), tipo_recargo: 'dia' });
  const [error, setError] = useState('');
  const [devolviendo, setDevolviendo] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(null); // null = cerrado
  const [errorCliente, setErrorCliente] = useState('');

  const cargar = () => {
    api.get('/equipos?estado=disponible').then(setEquipos);
    api.get('/clientes').then(setClientes);
    api.get('/alquileres?estado=activo').then(setAlquileres);
  };
  useEffect(() => { cargar(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const equipo = equipos.find((e) => String(e.id) === String(f.equipo_id));
  const fechasOk = f.fecha_devolucion_estimada >= f.fecha_inicio;
  const presupuesto = useMemo(() => {
    if (!equipo || !fechasOk) return null;
    const dias = diasAlquiler(f.fecha_inicio, f.fecha_devolucion_estimada);
    return {
      dias,
      base: dias * equipo.tarifa_diaria,
      unit: f.tipo_recargo === 'semana' ? equipo.recargo_semana : equipo.recargo_dia,
    };
  }, [equipo, f, fechasOk]);

  const setC = (k) => (e) => setNuevoCliente({ ...nuevoCliente, [k]: e.target.value });

  async function guardarCliente() {
    setErrorCliente('');
    try {
      const c = await api.post('/clientes', nuevoCliente);
      setClientes((prev) => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setF((prev) => ({ ...prev, cliente_id: String(c.id) }));
      setNuevoCliente(null);
    } catch (err) { setErrorCliente(err.message); }
  }

  async function registrar(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/alquileres', f);
      setF({ ...f, equipo_id: '' });
      cargar();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <h1>Alquileres</h1>
      <div className="dos-col">
        <form className="panel formulario una-col" onSubmit={registrar}>
          <h2>Nuevo alquiler</h2>
          <label className="ancho">Equipo
            <select required value={f.equipo_id} onChange={set('equipo_id')}>
              <option value="">Seleccione un equipo disponible</option>
              {equipos.map((e) => <option key={e.id} value={e.id}>{e.nombre} — {money(e.tarifa_diaria)}/día</option>)}
            </select>
          </label>
          <label className="ancho">Cliente
            <select required={!nuevoCliente} value={f.cliente_id} onChange={set('cliente_id')}>
              <option value="">{clientes.length ? 'Seleccione un cliente' : 'Aún no hay clientes: registre uno'}</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.documento})</option>)}
            </select>
          </label>
          {!nuevoCliente ? (
            <div className="ancho">
              <button type="button" onClick={() => setNuevoCliente({ nombre: '', documento: '', telefono: '', email: '', direccion: '' })}>
                Registrar cliente nuevo
              </button>
            </div>
          ) : (
            <div className="ancho subform">
              <h3>Nuevo cliente</h3>
              <label>Nombre o razón social<input value={nuevoCliente.nombre} onChange={setC('nombre')} /></label>
              <label>DNI / RUC<input value={nuevoCliente.documento} onChange={setC('documento')} /></label>
              <label>Teléfono<input value={nuevoCliente.telefono} onChange={setC('telefono')} /></label>
              <label>Correo<input value={nuevoCliente.email} onChange={setC('email')} /></label>
              <label className="ancho">Dirección de facturación<input value={nuevoCliente.direccion} onChange={setC('direccion')} /></label>
              {errorCliente && <p className="error ancho" role="alert">{errorCliente}</p>}
              <div className="acciones ancho">
                <button type="button" className="primario" onClick={guardarCliente}>Guardar y seleccionar</button>
                <button type="button" onClick={() => { setNuevoCliente(null); setErrorCliente(''); }}>Cancelar</button>
              </div>
            </div>
          )}
          <label>Fecha de inicio<input required type="date" value={f.fecha_inicio} onChange={set('fecha_inicio')} /></label>
          <label>Devolución estimada<input required type="date" min={f.fecha_inicio} value={f.fecha_devolucion_estimada} onChange={set('fecha_devolucion_estimada')} /></label>
          <fieldset className="ancho">
            <legend>Si se atrasa en la entrega, cobrar recargo por</legend>
            <label className="radio"><input type="radio" name="recargo" checked={f.tipo_recargo === 'dia'} onChange={() => setF({ ...f, tipo_recargo: 'dia' })} /> Día de atraso</label>
            <label className="radio"><input type="radio" name="recargo" checked={f.tipo_recargo === 'semana'} onChange={() => setF({ ...f, tipo_recargo: 'semana' })} /> Semana de atraso</label>
          </fieldset>

          <aside className="presupuesto ancho" aria-live="polite">
            <h3>Presupuesto</h3>
            {presupuesto ? (
              <>
                <div className="linea"><span>{presupuesto.dias} día(s) × {money(equipo.tarifa_diaria)}</span><span>{money(presupuesto.base)}</span></div>
                <div className="linea total"><span>Total del alquiler</span><span>{money(presupuesto.base)}</span></div>
                <p className="nota">
                  Si se atrasa: {money(presupuesto.unit)} por cada {f.tipo_recargo === 'semana' ? 'semana (o fracción)' : 'día'} de retraso, que se suma a este total.
                </p>
              </>
            ) : (
              <p className="nota">{fechasOk ? 'Elija un equipo para ver el total.' : 'La devolución no puede ser anterior al inicio.'}</p>
            )}
          </aside>

          {error && <p className="error ancho" role="alert">{error}</p>}
          <div className="acciones ancho"><button className="primario" type="submit" disabled={!presupuesto}>Registrar alquiler</button></div>
        </form>

        <section className="panel una-col">
          <h2>Alquileres activos</h2>
          {alquileres.length === 0 ? <p className="vacio">No hay equipos en mano de clientes.</p> : (
            <ul className="activos">
              {alquileres.map((a) => (
                <li key={a.id}>
                  <div className="fila-activo">
                    <div>
                      <strong>{a.equipo_nombre}</strong> · {a.cliente_nombre}<br />
                      <small>{a.fecha_inicio} → {a.fecha_devolucion_estimada} · {money(a.costo_base)}</small>
                      {a.dias_retraso_actual > 0 && <div className="peligro">Atrasado {a.dias_retraso_actual} día(s): {money(a.cargo_extra_actual)} de recargo acumulado</div>}
                    </div>
                    <button onClick={() => setDevolviendo(devolviendo === a.id ? null : a.id)}>{devolviendo === a.id ? 'Cerrar' : 'Devolver'}</button>
                  </div>
                  {devolviendo === a.id && <Devolver alquiler={a} onListo={() => { setDevolviendo(null); cargar(); }} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

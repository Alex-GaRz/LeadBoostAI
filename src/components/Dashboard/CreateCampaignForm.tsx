import React, { useState } from 'react';

const campaignObjectives = [
  'Conseguir más clientes (ventas)',
  'Que más personas conozcan mi marca',
  'Conseguir registros (emails, formularios)',
  'Aumentar visitas a mi página web',
  'Otro',
];

const CreateCampaignForm: React.FC = () => {
  const [form, setForm] = useState({
    empresa: '',
    producto: '',
    propuesta: '',
    objetivo: '',
    otroObjetivo: '',
    publico: '',
    lugares: '',
    presupuesto: '',
    duracion: '',
    otraDuracion: '',
    estilo: [] as string[],
  accion: '',
  destino: '',
  recursos: '',
  archivo: null as File | null,
  responsable: '',
  correo: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => {
        const estilos = prev.estilo as string[];
        if (checked) {
          return { ...prev, estilo: [...estilos, value] };
        } else {
          return { ...prev, estilo: estilos.filter(est => est !== value) };
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Validación
  if (
      !form.empresa.trim() ||
      !form.producto.trim() ||
      !form.propuesta.trim() ||
      !form.objetivo ||
      (form.objetivo === 'Otro' && !form.otroObjetivo.trim()) ||
      !form.publico.trim() ||
      !form.lugares.trim() ||
      !form.presupuesto.trim() ||
      !form.duracion ||
      (form.duracion === 'Otro' && !form.otraDuracion.trim()) ||
      (form.estilo.length === 0) ||
  !form.accion ||
  !form.destino.trim() ||
  !form.responsable.trim() ||
  !form.correo.trim()
    ) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setError('');
    alert('Campaña creada con éxito!');
  };

  return (
  <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-2 mb-16">
          <h2 className="text-2xl font-bold mb-4 text-[#2d4792]">Crear Nueva Campaña</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1) Sobre tu negocio */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Sobre tu negocio</h3>
              <label className="block font-semibold mb-1">¿Cuál es el nombre de tu empresa o marca?</label>
              <input
                type="text"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.empresa ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: Zapatería Los Pasos, Academia de Inglés Smart"
              />
              <label className="block font-semibold mb-1">¿Qué producto o servicio quieres promocionar?</label>
              <input
                type="text"
                name="producto"
                value={form.producto}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.producto ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: Zapatos de cuero para hombre / Clases de inglés online"
              />
              <label className="block font-semibold mb-1">¿Qué hace especial tu producto o servicio? (Propuesta de valor)</label>
              <input
                type="text"
                name="propuesta"
                value={form.propuesta}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted ? (form.propuesta ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: Hechos a mano con materiales ecológicos / Profesores nativos con clases en vivo"
              />
            </div>
      {/* 2) Objetivo de la campaña */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Objetivo de la campaña</h3>
              <label className="block font-semibold mb-1">¿Qué quieres lograr con esta campaña?</label>
              <select
                name="objetivo"
                value={form.objetivo}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted ? (form.objetivo ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
              >
                <option value="">Selecciona objetivo</option>
                {campaignObjectives.map(obj => (
                  <option key={obj} value={obj}>{obj}</option>
                ))}
              </select>
              {form.objetivo === 'Otro' && (
                <input
                  type="text"
                  name="otroObjetivo"
                  value={form.otroObjetivo}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mt-2 ${submitted ? (form.otroObjetivo ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="Especifica el objetivo"
                />
              )}
            </div>
            {/* 3) Público al que quieres llegar */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Público al que quieres llegar</h3>
              <label className="block font-semibold mb-1">¿A quién quieres llegar con tus anuncios?</label>
              <input
                type="text"
                name="publico"
                value={form.publico}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.publico ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: Hombres jóvenes interesados en deportes / Padres de familia con hijos en secundaria / Personas que quieren aprender inglés para el trabajo"
              />
              <label className="block font-semibold mb-1">¿En qué lugares quieres que aparezcan tus anuncios?</label>
              <input
                type="text"
                name="lugares"
                value={form.lugares}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted ? (form.lugares ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: CDMX, México, Latinoamérica, Estados Unidos"
              />
            </div>
            {/* 4) Presupuesto y duración */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Presupuesto y duración</h3>
              <label className="block font-semibold mb-1">¿Cuánto dinero quieres invertir en esta campaña?</label>
              <input
                type="text"
                name="presupuesto"
                value={form.presupuesto}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.presupuesto ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: $500 MXN, $100 USD, etc."
              />
              <label className="block font-semibold mb-1">¿Por cuánto tiempo quieres que dure la campaña?</label>
              <select
                name="duracion"
                value={form.duracion}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted ? (form.duracion ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
              >
                <option value="">Selecciona duración</option>
                <option value="1 semana">1 semana</option>
                <option value="2 semanas">2 semanas</option>
                <option value="1 mes">1 mes</option>
                <option value="Otro">Otro</option>
              </select>
              {form.duracion === 'Otro' && (
                <input
                  type="text"
                  name="otraDuracion"
                  value={form.otraDuracion}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mt-2 ${submitted ? (form.otraDuracion ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="Especifica la duración"
                />
              )}
            </div>
            {/* 5) Estilo del anuncio */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Estilo del anuncio</h3>
              <label className="block font-semibold mb-1">¿Cómo quieres que suenen tus anuncios? (elige 1 o varias opciones)</label>
              <div className="flex flex-wrap gap-3 mb-2">
                {['Profesional','Amigable / Cercano','Divertido','Elegante / Premium','Urgente (llamado rápido a la acción)'].map(e => (
                  <label key={e} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="estilo"
                      value={e}
                      checked={form.estilo.includes(e)}
                      onChange={handleChange}
                      className="accent-[#2d4792]"
                    />
                    {e}
                  </label>
                ))}
              </div>
              <label className="block font-semibold mb-1">¿Qué acción quieres que las personas realicen? (Call To Action)</label>
              <select
                name="accion"
                value={form.accion}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted ? (form.accion ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
              >
                <option value="">Selecciona acción</option>
                <option value="Comprar ahora">Comprar ahora</option>
                <option value="Registrarse">Registrarse</option>
                <option value="Pedir más información">Pedir más información</option>
                <option value="Descargar">Descargar</option>
                <option value="Llamar">Llamar</option>
              </select>
            </div>
            {/* 6) Página de destino */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Página de destino</h3>
              <label className="block font-semibold mb-1">¿A dónde quieres llevar a las personas que hagan clic en tu anuncio?</label>
              <input
                type="text"
                name="destino"
                value={form.destino}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destino ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: tu página web, WhatsApp, tienda en línea, formulario, etc."
              />
            </div>
            {/* 7) Recursos opcionales */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Recursos opcionales</h3>
              <label className="block font-semibold mb-1">¿Tienes imágenes o videos que quieras usar en la campaña?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recursos"
                    value="si"
                    checked={form.recursos === 'si'}
                    onChange={handleChange}
                    className="accent-[#2d4792]"
                  />
                  Sí (subir archivo)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recursos"
                    value="no"
                    checked={form.recursos === 'no'}
                    onChange={handleChange}
                    className="accent-[#2d4792]"
                  />
                  No, que la IA los sugiera
                </label>
              </div>
              {form.recursos === 'si' && (
                <input
                  type="file"
                  name="archivo"
                  accept="image/*,video/*"
                  onChange={e => setForm({ ...form, archivo: e.target.files ? e.target.files[0] : null })}
                  className="mb-2"
                />
              )}
            </div>
            {/* 8) Contacto */}
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Contacto</h3>
              <label className="block font-semibold mb-1">Nombre de la persona responsable de esta campaña</label>
              <input
                type="text"
                name="responsable"
                value={form.responsable}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.responsable ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Nombre completo"
              />
              <label className="block font-semibold mb-1">Correo de contacto</label>
              <input
                type="email"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted ? (form.correo ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="ejemplo@email.com"
              />
            </div>
            <button type="submit" className="w-full bg-[#2d4792] text-white py-2 rounded font-bold hover:bg-[#1d326b] transition">Crear campaña</button>
            {error && <div className="text-red-600 font-semibold mt-2 text-center">{error}</div>}
          </form>
        </div>
      );


}
export default CreateCampaignForm;

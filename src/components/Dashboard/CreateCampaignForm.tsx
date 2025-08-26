import React, { useState } from 'react';
import { generateId } from '../../utils/generateId';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const campaignObjectives = [
  'Conseguir más clientes (ventas)',
  'Que más personas conozcan mi marca',
  'Conseguir registros (emails, formularios)',
  'Aumentar visitas a mi página web',
  'Otro',
];

const CreateCampaignForm: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const { user } = useAuth();
  const [form, setForm] = useState({
    ad_platform: [] as string[],
    empresa: '',
    industria: '',
    producto: '',
    propuesta: '',
    objetivo: '',
    otroObjetivo: '',
    publico: '',
    lugares: '',
    presupuesto: '',
    moneda: 'MXN',
    duracion: '',
    otraDuracion: '',
    estilo: [] as string[],
    accion: '',
    destinoTipo: '',
    destinoValor: '',
    recursos: '',
    archivo: null as File | null,
    responsable: '',
    correo: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === 'ad_platform') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => {
        const platforms = prev.ad_platform as string[];
        if (checked) {
          return { ...prev, ad_platform: [...platforms, value] };
        } else {
          return { ...prev, ad_platform: platforms.filter(p => p !== value) };
        }
      });
    } else if (type === 'checkbox') {
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
        form.ad_platform.length === 0 ||
        !form.empresa.trim() ||
      !form.industria.trim() ||
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
      !form.destinoTipo ||
      !form.destinoValor.trim() ||
      !form.responsable.trim() ||
      !form.correo.trim()
    ) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setError('');
    setShowSummary(true);
  };

  const handleConfirm = async () => {
    if (!user) {
      setError('No se ha detectado usuario autenticado.');
      return;
    }
    try {
      const campaign_id = generateId();
      let fileUrl = '';
      if (form.archivo) {
        const storageRef = ref(storage, `clients/${user.uid}/campaigns/${campaign_id}/${form.archivo.name}`);
        await uploadBytes(storageRef, form.archivo);
        fileUrl = await getDownloadURL(storageRef);
      }
      const campaignData = {
        ad_platform: form.ad_platform,
        campaign_id,
        business_name: form.empresa,
        industry: form.industria,
        product_service: form.producto,
        value_proposition: form.propuesta,
        campaign_goal: form.objetivo === 'Otro' ? form.otroObjetivo : form.objetivo,
        target_audience: form.publico,
        locations: form.lugares.split(',').map(l => l.trim()),
        budget_amount: form.presupuesto,
        budget_currency: form.moneda,
        duration: form.duracion === 'Otro' ? form.otraDuracion : form.duracion,
        ad_style: form.estilo,
        call_to_action: form.accion,
        landing_page: form.destinoValor,
        landing_type: form.destinoTipo,
        assets: {
          images_videos: fileUrl
        },
        contact: {
          responsible_name: form.responsable,
          email: form.correo
        },
        createdAt: serverTimestamp(),
      };
      const campaignsRef = doc(db, `clients/${user.uid}/campaigns/${campaign_id}`);
      await setDoc(campaignsRef, campaignData);
      alert('¡Campaña creada y guardada exitosamente!');
      setForm({
        ad_platform: [],
        empresa: '',
        industria: '',
        producto: '',
        propuesta: '',
        objetivo: '',
        otroObjetivo: '',
        publico: '',
        lugares: '',
        presupuesto: '',
        moneda: 'MXN',
        duracion: '',
        otraDuracion: '',
        estilo: [],
        accion: '',
        destinoTipo: '',
        destinoValor: '',
        recursos: '',
        archivo: null,
        responsable: '',
        correo: '',
      });
      setSubmitted(false);
      setShowSummary(false);
    } catch (err) {
      setError('Error al guardar la campaña. Intenta de nuevo.');
      console.error(err);
    }
  };

  if (showSummary) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-2 mb-16">
        <h2 className="text-2xl font-bold mb-4 text-[#2d4792]">Resumen de la campaña</h2>
        <div className="mb-4 text-gray-800">
          <p>
            Esta campaña ha sido diseñada para la empresa <b>{form.empresa}</b>, que se especializa en la industria de <b>{form.industria}</b> y ofrece <b>{form.producto}</b> con la propuesta de valor <b>{form.propuesta}</b>. El objetivo principal de la campaña es <b>{form.objetivo === 'Otro' ? form.otroObjetivo : form.objetivo}</b>.<br /><br />
            Los anuncios estarán dirigidos a <b>{form.publico}</b> en <b>{form.lugares}</b>, y tendrán un estilo <b>{form.estilo.join(', ')}</b>, buscando captar la atención de forma efectiva y adecuada para la audiencia.<br /><br />
            El presupuesto asignado para la campaña es de <b>{form.presupuesto} {form.moneda}</b>, con una duración de <b>{form.duracion === 'Otro' ? form.otraDuracion : form.duracion}</b>.<br /><br />
            Los anuncios invitarán a los usuarios a <b>{form.accion}</b>, dirigiéndolos al destino especificado: <b>{form.destinoValor}</b> (<b>{form.destinoTipo}</b>).<br /><br />
            La campaña se ejecutará en la(s) plataforma(s): <b>{form.ad_platform.join(', ')}</b>.<br /><br />
            La persona responsable de la campaña es <b>{form.responsable}</b> (correo: <b>{form.correo}</b>), quien supervisará la ejecución y los resultados de la misma.
          </p>
        </div>
        <div className="flex gap-4">
          <button type="button" className="bg-gray-300 px-4 py-2 rounded font-bold" onClick={() => setShowSummary(false)}>Editar</button>
          <button type="button" className="bg-[#2d4792] text-white px-4 py-2 rounded font-bold" onClick={handleConfirm}>Confirmar y enviar</button>
        </div>
        {error && <div className="text-red-600 font-semibold mt-2 text-center">{error}</div>}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-2 mb-16">
      <h2 className="text-2xl font-bold mb-4 text-[#2d4792]">Crear Nueva Campaña</h2>
      {/* 1) Plataforma de anuncios */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Plataforma de anuncios</h3>
        <label className="block font-semibold mb-1">¿En qué plataforma quieres que se ejecute la campaña?</label>
        <select
          name="ad_platform"
          value={form.ad_platform[0] || ''}
          onChange={e => {
            let value = e.target.value;
            let platforms: string[] = [];
            if (value === 'Ambas') {
              platforms = ['Google Ads', 'Meta Ads'];
            } else if (value) {
              platforms = [value];
            }
            setForm(prev => ({ ...prev, ad_platform: platforms }));
          }}
          className={`w-full border rounded px-3 py-2 ${submitted ? (form.ad_platform.length > 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
        >
          <option value="">Selecciona plataforma</option>
          <option value="Google Ads">Google Ads</option>
          <option value="Meta Ads">Meta Ads</option>
          <option value="Ambas">Ambas</option>
        </select>
        {submitted && form.ad_platform.length === 0 && (
          <div className="text-red-600 text-sm mt-1">Selecciona una plataforma.</div>
        )}
      </div>
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
              <label className="block font-semibold mb-1">¿A qué industria o sector pertenece tu negocio?</label>
              <input
                type="text"
                name="industria"
                value={form.industria}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.industria ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                placeholder="Ejemplo: Calzado, Educación, Tecnología, Salud, etc."
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
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  name="presupuesto"
                  value={form.presupuesto}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 ${submitted ? (form.presupuesto ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="Cantidad"
                  min={0}
                />
                <select
                  name="moneda"
                  value={form.moneda}
                  onChange={handleChange}
                  className="border rounded px-2 py-2"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="COP">COP</option>
                  <option value="EUR">EUR</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
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
              <select
                name="destinoTipo"
                value={form.destinoTipo}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destinoTipo ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
              >
                <option value="">Selecciona una opción</option>
                <option value="Sitio web">Sitio web</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Messenger">Messenger</option>
                <option value="Producto">Página de producto específica</option>
                <option value="Otro">Otro</option>
              </select>
              {form.destinoTipo === 'Sitio web' && (
                <input
                  type="url"
                  name="destinoValor"
                  value={form.destinoValor}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destinoValor ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="URL del sitio web"
                  required={form.destinoTipo === 'Sitio web'}
                />
              )}
              {form.destinoTipo === 'WhatsApp' && (
                <input
                  type="text"
                  name="destinoValor"
                  value={form.destinoValor}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destinoValor ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="Número o link corto de WhatsApp"
                  required={form.destinoTipo === 'WhatsApp'}
                />
              )}
              {form.destinoTipo === 'Messenger' && (
                <input
                  type="text"
                  name="destinoValor"
                  value={form.destinoValor}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destinoValor ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="Usuario o link de Messenger"
                  required={form.destinoTipo === 'Messenger'}
                />
              )}
              {form.destinoTipo === 'Producto' && (
                <input
                  type="text"
                  name="destinoValor"
                  value={form.destinoValor}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destinoValor ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="URL o nombre de la página de producto"
                  required={form.destinoTipo === 'Producto'}
                />
              )}
              {form.destinoTipo === 'Otro' && (
                <input
                  type="text"
                  name="destinoValor"
                  value={form.destinoValor}
                  onChange={handleChange}
                  className={`w-full border rounded px-3 py-2 mb-2 ${submitted ? (form.destinoValor ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}
                  placeholder="Especifica el destino"
                  required={form.destinoTipo === 'Otro'}
                />
              )}
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
                <>
                  <input
                    type="file"
                    name="archivo"
                    accept="image/*,video/*"
                    onChange={e => {
                      const file = e.target.files ? e.target.files[0] : null;
                      setForm({ ...form, archivo: file });
                      if (file) {
                        setPreviewUrl(URL.createObjectURL(file));
                      } else {
                        setPreviewUrl(null);
                      }
                    }}
                    className="mb-2"
                  />
                  {previewUrl && (
                    <div className="mb-2">
                      {form.archivo && form.archivo.type.startsWith('image') ? (
                        <img src={previewUrl} alt="Vista previa" className="max-w-xs max-h-40 rounded shadow" />
                      ) : form.archivo && form.archivo.type.startsWith('video') ? (
                        <video src={previewUrl} controls className="max-w-xs max-h-40 rounded shadow" />
                      ) : null}
                    </div>
                  )}
                </>
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { generateId } from '../../utils/generateId';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { generateCampaignAI } from '../../services/OpenAIService';

const campaignObjectives = [
  'Conseguir más clientes (ventas)',
  'Que más personas conozcan mi marca',
  'Conseguir registros (emails, formularios)',
  'Aumentar visitas a mi página web',
  'Otro',
];

const CreateCampaignForm: React.FC = () => {
  const { user } = useAuth();
  const { campaignId } = useParams<{ campaignId?: string }>();
  const [loading, setLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const isEditMode = !!campaignId;

  // Pre-fill form if editing
  useEffect(() => {
    if (!user || !campaignId) return;
    const fetchCampaign = async () => {
      setLoading(true);
      try {
        const campaignRef = doc(db, `clients/${user.uid}/campaigns/${campaignId}`);
        const campaignSnap = await getDoc(campaignRef);
        if (campaignSnap.exists()) {
          const data = campaignSnap.data();
          setForm({
            ad_platform: data.ad_platform || [],
            empresa: data.business_name || '',
            industria: data.industry || '',
            producto: data.product_service || '',
            propuesta: data.value_proposition || '',
            objetivo: campaignObjectives.includes(data.campaign_goal) ? data.campaign_goal : 'Otro',
            otroObjetivo: !campaignObjectives.includes(data.campaign_goal) ? data.campaign_goal : '',
            publico: data.target_audience || '',
            lugares: Array.isArray(data.locations) ? data.locations.join(', ') : (data.locations || ''),
            presupuesto: data.budget_amount || '',
            moneda: data.budget_currency || 'MXN',
            duracion: ['1 semana','2 semanas','1 mes'].includes(data.duration) ? data.duration : (data.duration ? 'Otro' : ''),
            otraDuracion: !['1 semana','2 semanas','1 mes'].includes(data.duration) ? data.duration || '' : '',
            estilo: data.ad_style || [],
            accion: data.call_to_action || '',
            destinoTipo: data.landing_type || '',
            destinoValor: data.landing_page || '',
            recursos: data.recursos || '',
            archivos: [],
          });
        }
      } catch (err) {
        setError('Error al cargar la campaña para editar.');
      }
      setLoading(false);
    };
    fetchCampaign();
    // eslint-disable-next-line
  }, [user, campaignId]);
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();
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
    archivos: [] as File[]
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [step, setStep] = useState(1); // Controla el paso actual
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Eliminado: const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      form.estilo.length === 0 ||
      !form.accion ||
      !form.destinoTipo ||
      !form.destinoValor.trim()
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
    setLoading(true);
    let campaign_id = campaignId || generateId();
    try {
      let fileUrls: string[] = [];
      if (form.archivos && form.archivos.length > 0) {
        for (const file of form.archivos) {
          const storageRef = ref(storage, `clients/${user.uid}/campaigns/${campaign_id}/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          fileUrls.push(url);
        }
      }
      let recursosValue = '';
      if (form.recursos === 'productos') recursosValue = 'mejorar por IA';
      else if (form.recursos === 'anuncio') recursosValue = 'Anuncio hecho';
      else if (form.recursos === 'nada') recursosValue = 'Crear por IA';
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
        recursos: recursosValue,
        assets: { images_videos: fileUrls.length > 0 ? fileUrls : (isEditMode ? undefined : []) },
        ...(isEditMode ? {} : { createdAt: serverTimestamp() }),
      };
      const campaignsRef = doc(db, `clients/${user.uid}/campaigns/${campaign_id}`);
      if (isEditMode) {
        if (!fileUrls.length) delete campaignData.assets.images_videos;
        await updateDoc(campaignsRef, campaignData);
      } else {
        await setDoc(campaignsRef, campaignData);
      }

      // --- Generación con IA ---
      setIsGeneratingAI(true);
      try {
        const aiData = await generateCampaignAI(campaignData);
        await updateDoc(campaignsRef, aiData);
        // Si todo va bien, redirigir
        navigate(`/dashboard/campaign/${campaign_id}`);
      } catch (aiError: any) {
        console.error("Error en la generación por IA:", aiError);
        // Mostrar un error más específico y no redirigir
        setError(`Error de IA: ${aiError.message}. Por favor, inténtalo de nuevo o contacta a soporte.`);
        setIsGeneratingAI(false);
        setLoading(false); // Detener el loading general también
        return; // Detener la ejecución aquí
      }
      // --- Fin de la generación con IA ---

      // Limpiar formulario solo si no es modo edición y todo fue exitoso
      if (!isEditMode) {
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
          archivos: [],
        });
        setPreviewUrls([]);
        setSubmitted(false);
        setShowSummary(false);
        setStep(1);
      }
    } catch (err) {
      setError('Error al guardar la campaña. Intenta de nuevo.');
      console.error(err);
    } finally {
      // Esto solo se ejecutará si la IA no falla
      setIsGeneratingAI(false);
      setLoading(false);
    }
  };

  const nextStep = () => {
  setError('');
  setStep(step + 1);
  };

  // Eliminado prevStep, ya no se usa

  if (showSummary) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 mb-20 border border-gray-100">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Resumen</span>
            <span className="text-sm text-gray-500">100% completado</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-[#2d4792] rounded-full w-full transition-all"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-[#2d4792]">Resumen de la campaña</h2>
        <div className="mb-6 text-gray-800 text-base leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p>
            Esta campaña ha sido diseñada para la empresa <b>{form.empresa}</b>, que se especializa en la industria de <b>{form.industria}</b> y ofrece <b>{form.producto}</b> con la propuesta de valor <b>{form.propuesta}</b>.<br /><br />
            El objetivo principal de la campaña es <b>{form.objetivo === 'Otro' ? form.otroObjetivo : form.objetivo}</b>.<br /><br />
            Los anuncios estarán dirigidos a <b>{form.publico}</b> en <b>{form.lugares}</b>, y tendrán un estilo <b>{form.estilo.join(', ')}</b>.<br /><br />
            El presupuesto asignado es de <b>{form.presupuesto} {form.moneda}</b>, con una duración de <b>{form.duracion === 'Otro' ? form.otraDuracion : form.duracion}</b>.<br /><br />
            Los anuncios invitarán a los usuarios a <b>{form.accion}</b>, dirigiéndolos al destino: <b>{form.destinoValor}</b> (<b>{form.destinoTipo}</b>).<br /><br />
            Plataforma(s): <b>{form.ad_platform.join(', ')}</b>.
          </p>
        </div>
        <div className="flex gap-4 justify-center mt-6">
          <button type="button" className="bg-gray-300 px-6 py-2 rounded font-bold" onClick={() => setShowSummary(false)}>Editar</button>
          <button type="button" className="bg-[#2d4792] text-white px-6 py-2 rounded font-bold" onClick={handleConfirm}>Confirmar y enviar</button>
        </div>
        {error && <div className="text-red-600 font-semibold mt-4 text-center">{error}</div>}
      </div>
    );
  }

  if (loading && !isGeneratingAI) {
    return <div className="text-center py-16 text-gray-500 text-lg">Cargando...</div>;
  }

  if (isGeneratingAI) {
    return (
      <div className="text-center py-16 text-gray-600 text-lg">
        <p className="font-semibold text-xl mb-2">Estamos creando tu campaña con inteligencia artificial...</p>
        <p>Esto puede tardar unos segundos.</p>
        {error && <div className="text-red-600 font-semibold mt-4 text-center">{error}</div>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 mb-20 border border-gray-100">
      <h2 className="text-2xl font-bold mb-8 text-center text-[#2d4792]">Configurador de Campaña Publicitaria</h2>
      {/* Barra de progreso tipo wizard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Paso {step} de 5</span>
          <span className="text-sm text-gray-500">{Math.round((step/5)*100)}% completado</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-2 bg-[#2d4792] rounded-full transition-all" style={{ width: `${(step/5)*100}%` }}></div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Plataforma de anuncios</h3>
            <label className="block font-semibold mb-1">¿En qué plataforma quieres que se ejecute la campaña?</label>
            <select
              name="ad_platform"
              value={form.ad_platform.length > 0 ? (form.ad_platform.length === 2 ? 'Ambas' : form.ad_platform[0]) : ''}
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
              className={`w-full border rounded px-3 py-2 ${submitted && form.ad_platform.length === 0 ? 'border-red-500 bg-red-50' : ''}`}
            >
              <option value="">Selecciona plataforma</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Ambas">Ambas</option>
            </select>
            {submitted && form.ad_platform.length === 0 && (
              <div className="text-red-600 text-sm mt-1">Selecciona al menos una plataforma.</div>
            )}
            {/* Mostrar las plataformas seleccionadas */}
            {form.ad_platform.length > 0 && (
              <div className="mt-2 text-gray-700">
                Plataformas seleccionadas: {form.ad_platform.join(', ')}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Sobre tu negocio</h3>
            <label className="block font-semibold mb-1">¿Cuál es el nombre de tu empresa o marca?</label>
            <input
              type="text"
              name="empresa"
              value={form.empresa}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.empresa.trim() ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ejemplo: Zapatería Los Pasos, Academia de Inglés Smart"
            />
            <label className="block font-semibold mb-1">¿A qué industria o sector pertenece tu negocio?</label>
            <input
              type="text"
              name="industria"
              value={form.industria}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.industria.trim() ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ejemplo: Calzado, Educación, Tecnología, Salud, etc."
            />
            <label className="block font-semibold mb-1">¿Qué producto o servicio quieres promocionar?</label>
            <input
              type="text"
              name="producto"
              value={form.producto}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.producto.trim() ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ejemplo: Zapatos de cuero para hombre / Clases de inglés online"
            />
            <label className="block font-semibold mb-1">¿Qué hace especial tu producto o servicio? (Propuesta de valor)</label>
            <input
              type="text"
              name="propuesta"
              value={form.propuesta}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${submitted && !form.propuesta.trim() ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ejemplo: Hechos a mano con materiales ecológicos / Profesores nativos con clases en vivo"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Objetivo y Público</h3>
            <label className="block font-semibold mb-1">¿Qué quieres lograr con esta campaña?</label>
            <select
              name="objetivo"
              value={form.objetivo}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${submitted && !form.objetivo ? 'border-red-500 bg-red-50' : ''}`}
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
                className={`w-full border rounded px-3 py-2 mt-2 ${submitted && !form.otroObjetivo.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Especifica el objetivo"
              />
            )}
            <label className="block font-semibold mb-1 mt-4">¿A quién quieres llegar con tus anuncios?</label>
            <input
              type="text"
              name="publico"
              value={form.publico}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.publico.trim() ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ejemplo: Hombres jóvenes interesados en deportes / Padres de familia con hijos en secundaria"
            />
            <label className="block font-semibold mb-1">¿En qué lugares quieres que aparezcan tus anuncios?</label>
            <input
              type="text"
              name="lugares"
              value={form.lugares}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${submitted && !form.lugares.trim() ? 'border-red-500 bg-red-50' : ''}`}
              placeholder="Ejemplo: CDMX, México, Latinoamérica, Estados Unidos"
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Presupuesto, Estilo y Destino</h3>
            <label className="block font-semibold mb-1">¿Cuánto dinero quieres invertir en esta campaña?</label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                name="presupuesto"
                value={form.presupuesto}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${submitted && !form.presupuesto.trim() ? 'border-red-500 bg-red-50' : ''}`}
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
              className={`w-full border rounded px-3 py-2 ${submitted && !form.duracion ? 'border-red-500 bg-red-50' : ''}`}
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
                className={`w-full border rounded px-3 py-2 mt-2 ${submitted && !form.otraDuracion.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Especifica la duración"
              />
            )}
            <label className="block font-semibold mb-1 mt-4">¿Cómo quieres que suenen tus anuncios? (elige 1 o varias)</label>
            <div className="flex flex-wrap gap-3 mb-2">
              {['Profesional', 'Amigable / Cercano', 'Divertido', 'Elegante / Premium', 'Urgente (llamado rápido a la acción)'].map(e => (
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
            {submitted && form.estilo.length === 0 && (
              <div className="text-red-600 text-sm mt-1">Selecciona al menos un estilo.</div>
            )}
            <label className="block font-semibold mb-1 mt-4">¿Qué acción quieres que realicen?</label>
            <select
              name="accion"
              value={form.accion}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${submitted && !form.accion ? 'border-red-500 bg-red-50' : ''}`}
            >
              <option value="">Selecciona acción</option>
              <option value="Comprar ahora">Comprar ahora</option>
              <option value="Registrarse">Registrarse</option>
              <option value="Pedir más información">Pedir más información</option>
              <option value="Descargar">Descargar</option>
              <option value="Llamar">Llamar</option>
            </select>
            <label className="block font-semibold mb-1 mt-4">¿A dónde llevarás a los que hagan clic?</label>
            <select
              name="destinoTipo"
              value={form.destinoTipo}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.destinoTipo ? 'border-red-500 bg-red-50' : ''}`}
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
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.destinoValor.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="URL del sitio web"
              />
            )}
            {form.destinoTipo === 'WhatsApp' && (
              <input
                type="text"
                name="destinoValor"
                value={form.destinoValor}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.destinoValor.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Número o link corto de WhatsApp"
              />
            )}
            {form.destinoTipo === 'Messenger' && (
              <input
                type="text"
                name="destinoValor"
                value={form.destinoValor}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.destinoValor.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Usuario o link de Messenger"
              />
            )}
            {form.destinoTipo === 'Producto' && (
              <input
                type="text"
                name="destinoValor"
                value={form.destinoValor}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.destinoValor.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="URL o nombre de la página de producto"
              />
            )}
            {form.destinoTipo === 'Otro' && (
              <input
                type="text"
                name="destinoValor"
                value={form.destinoValor}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 mb-2 ${submitted && !form.destinoValor.trim() ? 'border-red-500 bg-red-50' : ''}`}
                placeholder="Especifica el destino"
              />
            )}
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="text-lg font-bold mb-2 text-[#2d4792]">Recursos</h3>
            <label className="block font-semibold mb-1">¿Cómo quieres crear tu anuncio?</label>
            <div className="flex flex-col gap-3 mb-4">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="recursos"
                  value="productos"
                  checked={form.recursos === 'productos'}
                  onChange={handleChange}
                  className="accent-[#2d4792] mt-1"
                />
                <span>
                  Tengo fotos o videos de mis productos<br />
                  <span className="text-xs text-gray-500">(La IA los usará para diseñar un anuncio atractivo.)</span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="recursos"
                  value="anuncio"
                  checked={form.recursos === 'anuncio'}
                  onChange={handleChange}
                  className="accent-[#2d4792] mt-1"
                />
                <span>
                  Ya tengo un anuncio hecho<br />
                  <span className="text-xs text-gray-500">(Sube tu anuncio y la IA lo adaptará/mejorará para esta campaña.)</span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="recursos"
                  value="nada"
                  checked={form.recursos === 'nada'}
                  onChange={handleChange}
                  className="accent-[#2d4792] mt-1"
                />
                <span>
                  No tengo nada, que la IA lo cree desde cero.
                </span>
              </label>
            </div>
            {(form.recursos === 'productos' || form.recursos === 'anuncio') && (
              <>
                <input
                  type="file"
                  name="archivos"
                  accept="image/*,video/*"
                  multiple
                  onChange={e => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setForm({ ...form, archivos: files });
                    setPreviewUrls(files.map(file => URL.createObjectURL(file)));
                  }}
                  className="mb-2"
                />
                {previewUrls.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.archivos.map((file, idx) => (
                      file.type.startsWith('image') ? (
                        <img key={idx} src={previewUrls[idx]} alt={`Vista previa ${idx + 1}`} className="max-w-xs max-h-40 rounded shadow" />
                      ) : file.type.startsWith('video') ? (
                        <video key={idx} src={previewUrls[idx]} controls className="max-w-xs max-h-40 rounded shadow" />
                      ) : null
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              type="button"
              className="bg-gray-300 px-4 py-2 rounded font-bold"
              onClick={() => setStep(step - 1)}
            >
              Regresar
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              className="bg-gray-300 px-4 py-2 rounded font-bold"
              onClick={() => navigate(-1)}
            >
              Regresar
            </button>
          )}
          {step < 5 && (
            <button
              type="button"
              className="bg-[#2d4792] text-white px-4 py-2 rounded font-bold"
              onClick={nextStep}
            >
              Continuar
            </button>
          )}
          {step === 5 && (
            <button
              type="submit"
              className="bg-[#2d4792] text-white px-4 py-2 rounded font-bold hover:bg-[#1d326b] transition"
            >
              Crear campaña
            </button>
          )}
        </div>
        {error && <div className="text-red-600 font-semibold mt-2 text-center">{error}</div>}
      </form>
    </div>
  );
};

export default CreateCampaignForm;
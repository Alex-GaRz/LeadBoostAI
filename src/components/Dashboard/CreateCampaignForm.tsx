import React, { useState, useEffect } from 'react';
import { Download, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { generateId } from '../../utils/generateId';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc, serverTimestamp, getDoc, collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { generateCampaignAI } from '../../services/OpenAIService';
import { generateImageWithVertex } from '../../services/VertexAIService';


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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const isEditMode = !!campaignId;

  const base64ToBlob = (base64: string, contentType: string = 'image/png'): Blob => {
    const b64 = base64.split(',')[1] ?? base64;
    const byteCharacters = atob(b64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

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
            descripcion: data.descripcion || ''
          });
          if (data.assets && data.assets.images_videos) {
            setExistingImageUrls(data.assets.images_videos);
          }
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
    archivos: [] as File[],
    descripcion: ''
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [step, setStep] = useState(1); // Controla el paso actual
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Eliminado editingSection, ya no se usa
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
    // Validar dimensiones de imagen antes de mostrar el resumen
    if ((form.recursos === 'productos' || form.recursos === 'anuncio') && form.archivos && form.archivos.length > 0) {
      const allowedSizes = [
        [1024, 1024], [1152, 896], [1216, 832], [1344, 768], [1536, 640],
        [640, 1536], [768, 1344], [832, 1216], [896, 1152]
      ];
      const file = form.archivos[0];
      if (file.type.startsWith('image')) {
        const img = document.createElement('img');
        const fileReader = new FileReader();
        fileReader.onload = () => {
          img.onload = () => {
            const valid = allowedSizes.some(([w, h]) => (img.width === w && img.height === h));
            if (!valid) {
              setError(`La imagen de entrada debe tener una de las siguientes dimensiones exactas: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152. La imagen seleccionada es ${img.width}x${img.height}.`);
            } else {
              setError('');
              setShowSummary(true);
            }
          };
          img.src = fileReader.result as string;
        };
        fileReader.readAsDataURL(file);
        return;
      }
    }
    setError('');
    setShowSummary(true);
  };

  const handleConfirm = async () => {
    // Validar dimensiones de imagen antes de cualquier procesamiento
    if ((form.recursos === 'productos' || form.recursos === 'anuncio') && form.archivos && form.archivos.length > 0) {
      const allowedSizes = [
        [1024, 1024], [1152, 896], [1216, 832], [1344, 768], [1536, 640],
        [640, 1536], [768, 1344], [832, 1216], [896, 1152]
      ];
      const file = form.archivos[0];
      if (file.type.startsWith('image')) {
        const img = document.createElement('img');
        const fileReader = new FileReader();
        const fileLoadPromise = new Promise<void>((resolve, reject) => {
          fileReader.onload = () => {
            img.onload = () => {
              const valid = allowedSizes.some(([w, h]) => (img.width === w && img.height === h));
              if (!valid) {
                setError(`La imagen de entrada debe tener una de las siguientes dimensiones exactas: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152. La imagen seleccionada es ${img.width}x${img.height}.`);
                reject();
              } else {
                resolve();
              }
            };
            img.onerror = reject;
            img.src = fileReader.result as string;
          };
          fileReader.onerror = reject;
          fileReader.readAsDataURL(file);
        });
        try {
          await fileLoadPromise;
        } catch {
          return; // Detener el proceso si la imagen no es válida
        }
      }
    }
    if (!user) {
      setError('No se ha detectado usuario autenticado.');
      return;
    }
    setLoading(true);
    let campaign_id = campaignId || generateId();
    const campaignsRef = doc(db, `clients/${user.uid}/campaigns/${campaign_id}`);

    try {
      // Primero, subir archivos si los hay
      let fileUrls: string[] = [];
      if (form.archivos && form.archivos.length > 0) {
        for (const file of form.archivos) {
          const storageRef = ref(storage, `clients/${user.uid}/campaigns/${campaign_id}/user_uploads/${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          fileUrls.push(url);
        }
      }

      // Construir el objeto de datos inicial de la campaña
      const campaignData: any = {
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
        recursos: form.recursos, // foto_existente, imagen_lista, solo_ideas, nada
        descripcion: form.recursos === 'solo_ideas' ? form.descripcion : null,
        assets: {
          images_videos: (form.recursos === 'foto_existente' || form.recursos === 'imagen_lista') && fileUrls.length > 0
            ? fileUrls
            : (isEditMode ? undefined : null)
        },
        ...(isEditMode ? {} : { createdAt: serverTimestamp() }),
      };

      // Guardar o actualizar el documento principal de la campaña

      // --- Lógica de generación de imágenes y texto con IA ---
      if (form.recursos !== 'imagen_lista') {
        const imageFile = form.recursos === 'foto_existente' ? form.archivos[0] : undefined;
        if (imageFile) {
          const allowedSizes = [
            [1024, 1024], [1152, 896], [1216, 832], [1344, 768], [1536, 640],
            [640, 1536], [768, 1344], [832, 1216], [896, 1152]
          ];
          const img = document.createElement('img');
          const fileReader = new FileReader();
          const fileLoadPromise = new Promise<void>((resolve, reject) => {
            fileReader.onload = () => {
              img.onload = () => {
                const valid = allowedSizes.some(([w, h]) => (img.width === w && img.height === h));
                if (!valid) {
                  setError(`La imagen de entrada debe tener una de las siguientes dimensiones exactas: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152. La imagen seleccionada es ${img.width}x${img.height}.`);
                  setIsGeneratingImage(false);
                  setLoading(false);
                  reject();
                } else {
                  resolve();
                }
              };
              img.onerror = reject;
              img.src = fileReader.result as string;
            };
            fileReader.onerror = reject;
            fileReader.readAsDataURL(imageFile);
          });
          try {
            await fileLoadPromise;
          } catch {
            return; // Detener el proceso si la imagen no es válida
          }
        }

        setIsGeneratingAI(true);
        try {
          const aiData = await generateCampaignAI(campaignData);
          console.log('Respuesta de OpenAI:', aiData);
          const vertexAiPrompt = aiData.vertex_ai_prompt;
          if (!vertexAiPrompt) {
            setError('No se recibió prompt para Vertex AI de OpenAI.');
            setIsGeneratingAI(false);
            setLoading(false);
            return;
          }
          console.log('Prompt para Vertex AI:', vertexAiPrompt);

          setIsGeneratingImage(true);
          try {
            const imageFile = form.recursos === 'foto_existente' ? form.archivos[0] : undefined;
            const response = await generateImageWithVertex(vertexAiPrompt);
            const base64Image = response; // La función ahora devuelve la cadena directamente
            const imageBlob = base64ToBlob(base64Image);

            const generatedImageRef = ref(storage, `clients/${user.uid}/campaigns/${campaign_id}/ia_data/generated_image.png`);
            await uploadBytes(generatedImageRef, imageBlob);
            const generatedImageUrl = await getDownloadURL(generatedImageRef);
            console.log('URL de imagen generada:', generatedImageUrl);

            await setDoc(campaignsRef, { 'assets.image_videos': [generatedImageUrl], generated_image_url: generatedImageUrl }, { merge: true });
            setIsGeneratingImage(false);
          } catch (imgError: any) {
            setError(`Error al generar o subir la imagen: ${imgError.message}`);
            setIsGeneratingImage(false);
            setLoading(false);
            return;
          }

          const iaDataRef = collection(db, `clients/${user.uid}/campaigns/${campaign_id}/ia_data`);
          await addDoc(iaDataRef, aiData);

        } catch (aiError: any) {
          setError(`Error en la generación de contenido por IA: ${aiError.message}`);
          setIsGeneratingAI(false);
          setLoading(false);
          return;
        }
        setIsGeneratingAI(false);
      }

      // --- Generación de texto con IA DESACTIVADA TEMPORALMENTE ---
      // setIsGeneratingAI(true);
      // let aiData = null;
      // try {
      //   aiData = await generateCampaignAI({ ...campaignData, generated_image_url: generatedImageUrl });
      //   if (!aiData || Object.keys(aiData).length === 0) {
      //     throw new Error('La IA no devolvió datos de texto válidos.');
      //   }
      // } catch (aiError: any) {
      //   setError(`Error en la generación de texto por IA: ${aiError.message}`);
      //   setIsGeneratingAI(false);
      //   setLoading(false);
      //   return; // Detener el proceso si el texto falla
      // }
      // setIsGeneratingAI(false);

      // Solo guardar la campaña si ambas IAs funcionaron
      // generatedImageUrl puede estar indefinido si no se generó imagen con IA
      let generatedImageUrl: string | undefined = undefined;
      // Buscar si ya se generó una imagen en la sección anterior
      if (form.recursos !== 'imagen_lista' && form.recursos !== 'nada') {
        // Si se generó imagen con IA, buscar la url en storage
        try {
          const generatedImageRef = ref(storage, `clients/${user.uid}/campaigns/${campaign_id}/ia_data/generated_image.png`);
          generatedImageUrl = await getDownloadURL(generatedImageRef);
        } catch (e) {
          // Puede no existir si no se generó imagen
        }
      }
      if (generatedImageUrl) {
        campaignData.generated_image_url = generatedImageUrl;
      }
      // Guardar campaña y datos IA
      // Usar setDoc con merge: true para crear o actualizar siempre
      if (!fileUrls.length) delete campaignData.assets.images_videos;
      await setDoc(campaignsRef, campaignData, { merge: true });
      // if (aiData) {
      //   const iaDataRef = collection(db, `clients/${user.uid}/campaigns/${campaign_id}/ia_data`);
      //   await addDoc(iaDataRef, aiData);
      // }

      // Si todo fue exitoso, navegar al dashboard
      setLoading(false);
      navigate(`/dashboard/campaign/${campaign_id}`);

    } catch (err: any) {
      setError(`Error al guardar la campaña: ${err.message}. Intenta de nuevo.`);
      console.error(err);
      setLoading(false);
      setIsGeneratingImage(false);
      setIsGeneratingAI(false);
    }
  };

  const nextStep = async () => {
    setError('');
    // Validar dimensiones de imagen antes de avanzar desde el paso 5 y si corresponde
    if (step === 5 && (form.recursos === 'productos' || form.recursos === 'anuncio') && form.archivos && form.archivos.length > 0) {
      const allowedSizes = [
        [1024, 1024], [1152, 896], [1216, 832], [1344, 768], [1536, 640],
        [640, 1536], [768, 1344], [832, 1216], [896, 1152]
      ];
      const file = form.archivos[0];
      if (file.type.startsWith('image')) {
        const img = document.createElement('img');
        const fileReader = new FileReader();
        fileReader.onload = () => {
          img.onload = () => {
            const valid = allowedSizes.some(([w, h]) => (img.width === w && img.height === h));
            if (!valid) {
              setError(`La imagen de entrada debe tener una de las siguientes dimensiones exactas: 1024x1024, 1152x896, 1216x832, 1344x768, 1536x640, 640x1536, 768x1344, 832x1216, 896x1152. La imagen seleccionada es ${img.width}x${img.height}.`);
            } else {
              setError('');
              setStep(step + 1);
            }
          };
          img.src = fileReader.result as string;
        };
        fileReader.readAsDataURL(file);
        return;
      }
    }
    setStep(step + 1);
  };

  // Eliminado prevStep, ya no se usa

  if (isGeneratingImage || isGeneratingAI) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600 text-lg">
        <div className="mb-6">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <p className="font-semibold text-xl mb-2">
          {isGeneratingImage ? "Generando imagen con IA..." : "Creando textos para tu campaña..."}
        </p>
        <p>Esto puede tardar unos segundos.</p>
        {error && <div className="text-red-600 font-semibold mt-4 text-center">{error}</div>}
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="max-w-6xl w-full mx-auto bg-white rounded-xl p-6 mt-8 mb-20 shadow-md">
  <h2 className="text-xl font-semibold mb-4 text-center text-black">Resumen de la campaña</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plataforma */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Plataforma</h3>
              <button onClick={() => { setShowSummary(false); setStep(1); }} className="text-sm text-blue-600">Editar</button>
            </div>
            <p className="text-sm">{form.ad_platform.join(', ')}</p>
          </div>
          {/* Información del negocio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Información del negocio</h3>
              <button onClick={() => { setShowSummary(false); setStep(2); }} className="text-sm text-blue-600">Editar</button>
            </div>
            <p className="text-sm font-semibold">Empresa: <span className="font-normal">{form.empresa}</span></p>
            <p className="text-sm font-semibold">Industria: <span className="font-normal">{form.industria}</span></p>
            <p className="text-sm font-semibold">Producto/Servicio: <span className="font-normal">{form.producto}</span></p>
            <p className="text-sm font-semibold">Propuesta de valor: <span className="font-normal">{form.propuesta}</span></p>
          </div>
          {/* Objetivo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Objetivo</h3>
              <button onClick={() => { setShowSummary(false); setStep(3); }} className="text-sm text-blue-600">Editar</button>
            </div>
            <p className="text-sm">{form.objetivo === 'Otro' ? form.otroObjetivo : form.objetivo}</p>
          </div>
          {/* Duración */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Duración y Presupuesto</h3>
              <button onClick={() => { setShowSummary(false); setStep(4); }} className="text-sm text-blue-600">Editar</button>
            </div>
            <p className="text-sm font-semibold">Duración: <span className="font-normal">{form.duracion === 'Otro' ? form.otraDuracion : form.duracion}</span></p>
            <p className="text-sm font-semibold">Presupuesto: <span className="font-normal">{form.presupuesto} {form.moneda}</span></p>
          </div>
          {/* Recursos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Recursos</h3>
              <button onClick={() => { setShowSummary(false); setStep(5); }} className="text-sm text-blue-600">Editar</button>
            </div>
            <p className="text-sm">{form.recursos}</p>
            {(existingImageUrls.length > 0 || previewUrls.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {existingImageUrls.map((url, idx) => (
                  <img key={`existing-${idx}`} src={url} alt={`Imagen existente ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                ))}
                {previewUrls.map((url, idx) => (
                  <img key={`new-${idx}`} src={url} alt={`Vista previa ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4 justify-center mt-6">
          <button type="button" className="bg-[#2563eb] text-white px-6 py-2 rounded-md font-medium" onClick={handleConfirm}>Confirmar y enviar</button>
        </div>
        {error && <div className="text-red-600 text-sm mt-4 text-center">{error}</div>}
      </div>
    );
  }

  if (loading && !isGeneratingAI) {
    return <div className="text-center py-16 text-gray-500 text-lg">Cargando...</div>;
  }

  if (isGeneratingAI) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600 text-lg">
        <div className="mb-6">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <p className="font-semibold text-xl mb-2">Estamos creando tu campaña con inteligencia artificial...</p>
        <p>Esto puede tardar unos segundos.</p>
        {error && <div className="text-red-600 font-semibold mt-4 text-center">{error}</div>}
      </div>
    );
  }

  return (
  <div className="max-w-6xl w-full h-[600px] mx-auto bg-white rounded-xl p-6 mt-8 mb-20 shadow-md flex flex-col">
  <h2 className="text-xl font-semibold mb-4 text-center text-black">Configura Tu Campaña</h2>
      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="w-full h-1 bg-gray-200 rounded-full">
          <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${(step/5)*100}%` }}></div>
        </div>
      </div>
  <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto space-y-4 pr-2">
        {step === 1 && (
          <div>
            <label className="block text-sm text-gray-500 mb-1">¿En qué plataforma quieres que se ejecute la campaña?</label>
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
              className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && form.ad_platform.length === 0 ? 'border-red-500' : ''}`}
            >
              <option value="">Selecciona plataforma</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Ambas">Ambas</option>
            </select>
            {submitted && form.ad_platform.length === 0 && <p className="text-red-500 text-sm mt-1">Selecciona al menos una plataforma.</p>}
            {form.ad_platform.length > 0 && <p className="text-gray-600 text-sm mt-2">Plataformas seleccionadas: {form.ad_platform.join(', ')}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Nombre de tu empresa o marca</label>
              <input
                type="text"
                name="empresa"
                value={form.empresa}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.empresa.trim() ? 'border-red-500' : ''}`}
                placeholder="Ejemplo: Zapatería Los Pasos"
              />
              {submitted && !form.empresa.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Industria o sector</label>
              <input
                type="text"
                name="industria"
                value={form.industria}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.industria.trim() ? 'border-red-500' : ''}`}
                placeholder="Ejemplo: Calzado"
              />
              {submitted && !form.industria.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Producto o servicio a promocionar</label>
              <input
                type="text"
                name="producto"
                value={form.producto}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.producto.trim() ? 'border-red-500' : ''}`}
                placeholder="Ejemplo: Zapatos de cuero"
              />
              {submitted && !form.producto.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Propuesta de valor</label>
              <input
                type="text"
                name="propuesta"
                value={form.propuesta}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.propuesta.trim() ? 'border-red-500' : ''}`}
                placeholder="Ejemplo: Hechos a mano con materiales ecológicos"
              />
              {submitted && !form.propuesta.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Objetivo de la campaña</label>
              <select
                name="objetivo"
                value={form.objetivo}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.objetivo ? 'border-red-500' : ''}`}
              >
                <option value="">Selecciona objetivo</option>
                {campaignObjectives.map(obj => (
                  <option key={obj} value={obj}>{obj}</option>
                ))}
              </select>
              {submitted && !form.objetivo && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
              {form.objetivo === 'Otro' && (
                <input
                  type="text"
                  name="otroObjetivo"
                  value={form.otroObjetivo}
                  onChange={handleChange}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 mt-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.otroObjetivo.trim() ? 'border-red-500' : ''}`}
                  placeholder="Especifica el objetivo"
                />
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Público objetivo</label>
              <input
                type="text"
                name="publico"
                value={form.publico}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.publico.trim() ? 'border-red-500' : ''}`}
                placeholder="Ejemplo: Hombres jóvenes interesados en deportes"
              />
              {submitted && !form.publico.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Lugares para los anuncios</label>
              <input
                type="text"
                name="lugares"
                value={form.lugares}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.lugares.trim() ? 'border-red-500' : ''}`}
                placeholder="Ejemplo: CDMX, México"
              />
              {submitted && !form.lugares.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
            {/* Presupuesto movido del paso 4 al paso 3 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">Presupuesto</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="presupuesto"
                  value={form.presupuesto}
                  onChange={handleChange}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.presupuesto.trim() ? 'border-red-500' : ''}`}
                  placeholder="Cantidad"
                  min={0}
                />
                <select
                  name="moneda"
                  value={form.moneda}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md px-2 py-2 text-gray-700"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="COP">COP</option>
                  <option value="EUR">EUR</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              {submitted && !form.presupuesto.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Duración</label>
              <select
                name="duracion"
                value={form.duracion}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.duracion ? 'border-red-500' : ''}`}
              >
                <option value="">Selecciona duración</option>
                <option value="1 semana">1 semana</option>
                <option value="2 semanas">2 semanas</option>
                <option value="1 mes">1 mes</option>
                <option value="Otro">Otro</option>
              </select>
              {submitted && !form.duracion && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
              {form.duracion === 'Otro' && (
                <input
                  type="text"
                  name="otraDuracion"
                  value={form.otraDuracion}
                  onChange={handleChange}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 mt-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.otraDuracion.trim() ? 'border-red-500' : ''}`}
                  placeholder="Especifica la duración"
                />
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Estilo de los anuncios</label>
              <select
                name="estilo"
                value={form.estilo[0] || ''}
                onChange={e => {
                  setForm({ ...form, estilo: e.target.value ? [e.target.value] : [] });
                }}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && form.estilo.length === 0 ? 'border-red-500 bg-red-50' : ''}`}
              >
                <option value="">Selecciona estilo</option>
                <option value="Profesional">Profesional</option>
                <option value="Amigable / Cercano">Amigable / Cercano</option>
                <option value="Divertido">Divertido</option>
                <option value="Elegante / Premium">Elegante / Premium</option>
                <option value="Urgente (llamado rápido a la acción)">Urgente (llamado rápido a la acción)</option>
              </select>
              {submitted && form.estilo.length === 0 && <p className="text-red-500 text-sm mt-1">Selecciona al menos un estilo</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Acción que quieres que realicen</label>
              <select
                name="accion"
                value={form.accion}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.accion ? 'border-red-500' : ''}`}
              >
                <option value="">Selecciona acción</option>
                <option value="Comprar ahora">Comprar ahora</option>
                <option value="Registrarse">Registrarse</option>
                <option value="Pedir más información">Pedir más información</option>
                <option value="Descargar">Descargar</option>
                <option value="Llamar">Llamar</option>
              </select>
              {submitted && !form.accion && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Destino al hacer clic</label>
              <select
                name="destinoTipo"
                value={form.destinoTipo}
                onChange={handleChange}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.destinoTipo ? 'border-red-500' : ''}`}
              >
                <option value="">Selecciona una opción</option>
                <option value="Sitio web">Sitio web</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Messenger">Messenger</option>
                <option value="Producto">Página de producto específica</option>
                <option value="Otro">Otro</option>
              </select>
              {submitted && !form.destinoTipo && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
              {form.destinoTipo && (
                <input
                  type="text"
                  name="destinoValor"
                  value={form.destinoValor}
                  onChange={handleChange}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 mt-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500 ${submitted && !form.destinoValor.trim() ? 'border-red-500' : ''}`}
                  placeholder={form.destinoTipo === 'Sitio web' ? 'URL del sitio web' : 'Especifica el destino'}
                />
              )}
              {submitted && !form.destinoValor.trim() && <p className="text-red-500 text-sm mt-1">Campo requerido</p>}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <label className="block text-sm text-gray-700 font-semibold mb-1">
              ¿Qué elementos tienes disponibles para crear la imagen de tu anuncio y qué deseas que la IA genere?
            </label>
            <div className="space-y-3">
              {/* Opción 1: Tengo una foto de mi producto/servicio */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recursos"
                    value="foto_existente"
                    checked={form.recursos === 'foto_existente'}
                    onChange={e => setForm({ ...form, recursos: e.target.value, archivos: [], descripcion: '' })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold">Tengo una foto de mi producto/servicio</span>
                    <span className="block text-xs text-gray-500 font-semibold">
                      La IA usará esta imagen y la adaptará para crear la imagen final del anuncio, ajustando composición, estilo y formato según la plataforma.
                    </span>
                  </span>
                </label>
                {form.recursos === 'foto_existente' && (
                  <div className="mt-2">
                    <label className="inline-flex items-center cursor-pointer bg-[#2461e9] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
                      <Upload className="w-5 h-5 mr-2" />
                      Subir foto
                      <input
                        type="file"
                        name="archivos"
                        accept="image/*"
                        onChange={e => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          setForm({ ...form, archivos: files });
                          setPreviewUrls(files.map(file => URL.createObjectURL(file)));
                        }}
                        className="hidden"
                      />
                    </label>
                    {previewUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        {form.archivos.map((_, idx) => (
                          <div key={idx} className="relative group">
                            <img src={previewUrls[idx]} alt={`Vista previa ${idx + 1}`} className="w-40 h-40 object-cover rounded" />
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100 transition"
                              title="Quitar archivo"
                              onClick={() => {
                                const newArchivos = form.archivos.filter((_, i) => i !== idx);
                                const newPreviews = previewUrls.filter((_, i) => i !== idx);
                                setForm({ ...form, archivos: newArchivos });
                                setPreviewUrls(newPreviews);
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Opción 2: Ya tengo una imagen de anuncio lista */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recursos"
                    value="imagen_lista"
                    checked={form.recursos === 'imagen_lista'}
                    onChange={e => setForm({ ...form, recursos: e.target.value, archivos: [], descripcion: '' })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold">Ya tengo una imagen de anuncio lista</span>
                    <span className="block text-xs text-gray-500 font-semibold">
                      Sube tu imagen y la IA la replicará tal cual, optimizando solo el formato si es necesario para la plataforma.
                    </span>
                  </span>
                </label>
                {form.recursos === 'imagen_lista' && (
                  <div className="mt-2">
                    <label className="inline-flex items-center cursor-pointer bg-[#2461e9] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
                      <Upload className="w-5 h-5 mr-2" />
                      Subir imagen
                      <input
                        type="file"
                        name="archivos"
                        accept="image/*"
                        onChange={e => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          setForm({ ...form, archivos: files });
                          setPreviewUrls(files.map(file => URL.createObjectURL(file)));
                        }}
                        className="hidden"
                      />
                    </label>
                    {previewUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        {form.archivos.map((_, idx) => (
                          <div key={idx} className="relative group">
                            <img src={previewUrls[idx]} alt={`Vista previa ${idx + 1}`} className="w-40 h-40 object-cover rounded" />
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100 transition"
                              title="Quitar archivo"
                              onClick={() => {
                                const newArchivos = form.archivos.filter((_, i) => i !== idx);
                                const newPreviews = previewUrls.filter((_, i) => i !== idx);
                                setForm({ ...form, archivos: newArchivos });
                                setPreviewUrls(newPreviews);
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Opción 3: Solo tengo ideas o conceptos */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recursos"
                    value="solo_ideas"
                    checked={form.recursos === 'solo_ideas'}
                    onChange={e => setForm({ ...form, recursos: e.target.value, archivos: [] })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold">Solo tengo ideas o conceptos</span>
                    <span className="block text-xs text-gray-500 font-semibold">
                      Proporciona descripciones, palabras clave o conceptos; la IA generará la imagen completa desde cero, aplicando estilo, composición y colores adecuados.
                    </span>
                  </span>
                </label>
                {form.recursos === 'solo_ideas' && (
                  <div className="mt-2">
                    <textarea
                      name="descripcion"
                      value={form.descripcion || ''}
                      onChange={e => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      placeholder="Describe tus ideas, palabras clave o conceptos para la imagen del anuncio"
                      rows={3}
                    />
                  </div>
                )}
              </div>
              {/* Opción 4: No tengo nada */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recursos"
                    value="nada"
                    checked={form.recursos === 'nada'}
                    onChange={e => setForm({ ...form, recursos: e.target.value, archivos: [], descripcion: '' })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold">No tengo nada</span>
                    <span className="block text-xs text-gray-500 font-semibold">
                      La IA creará toda la imagen del anuncio desde cero: producto/servicio, composición, estilo y formato, adaptados al público y plataforma seleccionada.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

  <div className="flex justify-between items-center pt-8 mt-auto">
          {step > 1 && (
            <button
              type="button"
              className="text-gray-600 text-sm"
              onClick={() => setStep(step - 1)}
            >
              Regresar
            </button>
          )}
          {step === 1 && (
            <button
              type="button"
              className="text-gray-600 text-sm"
              onClick={() => navigate(-1)}
            >
              Regresar
            </button>
          )}
          {step < 5 && (
            <button
              type="button"
              className="px-6 py-2 rounded-md font-medium"
              style={{ backgroundColor: '#2461e9', color: '#fff' }}
              onClick={nextStep}
            >
              Continuar
            </button>
          )}
          {step === 5 && (
            <button
              type="submit"
              className="px-6 py-2 rounded-md font-medium"
              style={{ backgroundColor: '#2461e9', color: '#fff' }}
            >
              Crear campaña
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      </form>
      {/* Eliminado EditSectionModal, ahora la edición es por navegación de pasos */}
    </div>
  );
};

export default CreateCampaignForm;
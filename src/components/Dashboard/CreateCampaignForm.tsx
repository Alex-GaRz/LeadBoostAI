import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const campaignObjectives = [
  'Ventas',
  'Leads',
  'Tráfico',
  'Otro',
];
const platforms = [
  'Google Ads',
  'Meta Ads',
  'Ambas',
];
const tones = [
  'Formal',
  'Amigable',
  'Persuasivo',
  'Otro',
];

const CreateCampaignForm: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    objetivo: '',
    plataforma: '',
    presupuesto: '',
    idioma: '',
    pais: '',
    sector: '',
    producto: '',
    publico: '',
    tono: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Validar que todos los campos estén llenos
    for (const key in form) {
      if (!form[key as keyof typeof form] || (typeof form[key as keyof typeof form] === 'string' && form[key as keyof typeof form].trim() === '')) {
        setError('Todos los campos son obligatorios.');
        return;
      }
    }
    setError('');
    // Aquí iría la lógica para guardar la campaña
    alert('Campaña creada con éxito!');
  };

  return (
  <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-2 mb-16">
      <h2 className="text-2xl font-bold mb-4 text-[#2d4792]">Crear Nueva Campaña</h2>
  <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Objetivo de la campaña</label>
          <select name="objetivo" value={form.objetivo} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.objetivo ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}> 
            <option value="">Selecciona objetivo</option>
            {campaignObjectives.map(obj => <option key={obj} value={obj}>{obj}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Plataforma</label>
          <select name="plataforma" value={form.plataforma} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.plataforma ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}> 
            <option value="">Selecciona plataforma</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Presupuesto</label>
          <input type="number" name="presupuesto" value={form.presupuesto} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.presupuesto ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} placeholder="Ej: 5000" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Idioma objetivo</label>
            <input type="text" name="idioma" value={form.idioma} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.idioma ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} placeholder="Ej: Español" />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">País objetivo</label>
            <input type="text" name="pais" value={form.pais} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.pais ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} placeholder="Ej: México" />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Sector / industria</label>
          <input type="text" name="sector" value={form.sector} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.sector ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} placeholder="Ej: Retail, Tecnología" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Producto o servicio a promocionar</label>
          <input type="text" name="producto" value={form.producto} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.producto ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} placeholder="Ej: Zapatos deportivos" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Público objetivo</label>
          <textarea name="publico" value={form.publico} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.publico ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`} placeholder="Edad, intereses, ubicación, etc." />
        </div>
        <div>
          <label className="block font-semibold mb-1">Tono de comunicación</label>
          <select name="tono" value={form.tono} onChange={handleChange} className={`w-full border rounded px-3 py-2 ${submitted ? (form.tono ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50') : ''}`}>
            <option value="">Selecciona tono</option>
            {tones.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
  <button type="submit" className="w-full bg-[#2d4792] text-white py-2 rounded font-bold hover:bg-[#1d326b] transition">Crear campaña</button>
  {error && <div className="text-red-600 font-semibold mt-2 text-center">{error}</div>}
      </form>
    </div>
  );
};

export default CreateCampaignForm;

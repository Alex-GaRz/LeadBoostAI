import React, { useEffect, useState } from 'react';
import { MetaIcon } from '../PlatformIcons';
import { GoogleIcon } from '../PlatformIcons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { editCampaign } from '../../utils/editCampaign';

interface Campaign {
  id: string;
  "Nombre de campaña"?: string;
  status?: 'Activa' | 'Pausada' | 'En revisión' | 'Finalizada';
  platform?: string;
  budget?: number;
  budget_currency?: string;
  generated_image_url?: string;
  user_image_url?: string;
  impresiones?: number;
  clicks?: number;
}



const RecentCampaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const campaignsCol = collection(db, `clients/${user.uid}/campaigns`);
        const snapshot = await getDocs(campaignsCol);
        // Para cada campaña, buscar el campo 'Nombre de campaña' en la subcolección 'ia_data'
        const data = await Promise.all(snapshot.docs.map(async doc => {
          const d = doc.data();
          // Determinar plataforma
          let platform: string = '—';
          if (Array.isArray(d.ad_platform)) {
            if (d.ad_platform.includes('MetaAds') && d.ad_platform.includes('GoogleAds')) {
              platform = 'Mixta';
            } else if (d.ad_platform.includes('MetaAds')) {
              platform = 'Meta Ads';
            } else if (d.ad_platform.includes('GoogleAds')) {
              platform = 'Google Ads';
            } else if (d.ad_platform.length > 0) {
              platform = d.ad_platform.join(', ');
            }
          }
          // Buscar en la subcolección ia_data
          let nombreCampania = d["Nombre de campaña"] || d["campaign_name"];
          let generated_image_url = d.generated_image_url;
          // Corregido: Buscar la imagen del usuario en la ubicación correcta
          let user_image_url = d.assets?.images_videos?.[0];
          let impresiones = d.impressions || d.impresiones || 0;
          let clicks = d.clicks || 0;
          if (!nombreCampania || !generated_image_url) {
            try {
              const iaDataCol = collection(db, `clients/${user.uid}/campaigns/${doc.id}/ia_data`);
              const iaSnapshot = await getDocs(iaDataCol);
              if (!iaSnapshot.empty) {
                const iaDocData = iaSnapshot.docs[0].data();
                nombreCampania = nombreCampania || iaDocData["Nombre de campaña"] || iaDocData["campaign_name"];
                generated_image_url = generated_image_url || iaDocData.generated_image_url;
                impresiones = impresiones || iaDocData.impressions || iaDocData.impresiones || 0;
                clicks = clicks || iaDocData.clicks || 0;
              }
            } catch {}
          }
          return {
            id: doc.id,
            "Nombre de campaña": nombreCampania,
            status: d.status,
            platform,
            budget: typeof d.budget_amount === 'number' ? d.budget_amount : (parseFloat(d.budget_amount) || undefined),
            budget_currency: d.budget_currency,
            generated_image_url,
            user_image_url,
            impresiones,
            clicks,
          };
        }));
        setCampaigns(data);
      } catch (err) {
        setCampaigns([]);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, [user]);

  const handleViewDetails = (campaignId: string) => {
    navigate(`/dashboard/campaign/${campaignId}`);
  };

  return (
    <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-8">
    <h2 className="text-2xl font-semibold text-black mb-1">Mis campañas</h2>
    <p className="text-[#6B7280] text-sm mb-4">Gestiona y optimiza tus campañas activas</p>
      {loading ? (
        <div className="text-gray-500 text-center py-8">Cargando campañas...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Aún no tienes campañas, crea tu primera ahora.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {campaigns.map((c) => {
            // Determinar la imagen a mostrar
            const imageUrl = c.generated_image_url || c.user_image_url || 'https://via.placeholder.com/400x200?text=Sin+imagen';
            let statusLabel = c.status || 'Activa';
            let statusColor = statusLabel === 'Activa' ? 'bg-green-100 text-green-700' : statusLabel === 'Pausada' ? 'bg-yellow-100 text-yellow-700' : statusLabel === 'Finalizada' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700';
            return (
              <div key={c.id} className="rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden flex flex-col">
                <div className="relative h-80 w-full overflow-hidden">
                  <img src={imageUrl} alt={c["Nombre de campaña"] || 'Sin título'} className="w-full h-full object-cover object-center" style={{ background: '#000' }} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold mb-1">{c["Nombre de campaña"] || 'Sin título'}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {c.platform === 'Meta Ads' && <MetaIcon className="w-5 h-5" />}
                    {c.platform === 'Google Ads' && <GoogleIcon className="w-5 h-5" />}
                    {c.platform === 'Mixta' && <><MetaIcon className="w-5 h-5" /><GoogleIcon className="w-5 h-5 ml-1" /></>}
                    <span className="text-xs text-[#2563eb] font-semibold">{c.platform || '—'}</span>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <div>Presupuesto: <span className="font-semibold">{typeof c.budget === 'number' ? `$${c.budget.toLocaleString()}` : '—'}</span></div>
                    <div>Impresiones: <span className="font-semibold">{c.impresiones?.toLocaleString() || '—'}</span></div>
                    <div>Clicks: <span className="font-semibold">{c.clicks?.toLocaleString() || '—'}</span></div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button className="border border-[#2563eb] text-[#2563eb] font-semibold px-4 py-2 rounded-lg hover:bg-[#2563eb] hover:text-white transition" onClick={() => editCampaign(c.id, navigate)}>Editar</button>
                    <button className="bg-[#2563eb] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition" onClick={() => handleViewDetails(c.id)}>Ver detalles</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentCampaigns;

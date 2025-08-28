import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  name?: string;
  business_name: string;
  status?: 'Activa' | 'Pausada' | 'En revisión';
  platform?: string;
  budget?: number;
  budget_currency?: string;
}

const statusColors: Record<string, string> = {
  'Activa': 'bg-green-100 text-green-700',
  'Pausada': 'bg-yellow-100 text-yellow-700',
  'En revisión': 'bg-blue-100 text-blue-700',
};


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
        const data = snapshot.docs.map(doc => {
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
          return {
            id: doc.id,
            name: d.name,
            business_name: d.business_name,
            status: d.status,
            platform,
            budget: typeof d.budget_amount === 'number' ? d.budget_amount : (parseFloat(d.budget_amount) || undefined),
            budget_currency: d.budget_currency,
          };
        });
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
      <h2 className="text-xl font-bold text-black mb-1">Campañas recientes</h2>
      <p className="text-gray-600 mb-4">Gestiona y optimiza tus campañas activas</p>
      {loading ? (
        <div className="text-gray-500 text-center py-8">Cargando campañas...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Aún no tienes campañas, crea tu primera ahora.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {campaigns.map((c) => {
            // Determinar la plataforma a mostrar
            let platformLabel = c.platform || '—';
            return (
              <li key={c.id} className="flex items-center justify-between py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-black">{c.name || ''}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[c.status || 'Activa']}`}>{c.status || 'Activa'}</span>
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">{platformLabel}</span>
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Presupuesto: {typeof c.budget === 'number' ? `$${c.budget.toLocaleString()}${c.budget_currency ? ' ' + c.budget_currency : ''}` : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-[#2d4792] hover:underline text-sm font-medium" onClick={() => handleViewDetails(c.id)}>Ver detalles</button>
                  <button className="text-[#2d4792] hover:underline text-sm font-medium">Editar</button>
                  <button className="text-[#2d4792] hover:underline text-sm font-medium">Pausar</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentCampaigns;

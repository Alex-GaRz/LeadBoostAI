import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  business_name: string;
  status?: 'Activa' | 'Pausada' | 'En revisión';
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
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Campaign[];
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
          {campaigns.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-4">
              <div className="flex flex-col">
                <span className="font-semibold text-black">{c.business_name}</span>
                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${statusColors[c.status || 'Activa']}`}>{c.status || 'Activa'}</span>
              </div>
              <div className="flex gap-2">
                <button className="text-[#2d4792] hover:underline text-sm font-medium" onClick={() => handleViewDetails(c.id)}>Ver detalles</button>
                <button className="text-[#2d4792] hover:underline text-sm font-medium">Editar</button>
                <button className="text-[#2d4792] hover:underline text-sm font-medium">Pausar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentCampaigns;

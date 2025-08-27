import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import DashboardCampaignTabs from './DashboardCampaignTabs';
import DashboardLayout from './DashboardLayout';

const DashboardCampaignPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!user || !campaignId) return;
      setLoading(true);
      try {
        const campaignRef = doc(db, `clients/${user.uid}/campaigns/${campaignId}`);
        const campaignSnap = await getDoc(campaignRef);
        if (campaignSnap.exists()) {
          setCampaign(campaignSnap.data());
        } else {
          setCampaign(null);
        }
      } catch (err) {
        setCampaign(null);
      }
      setLoading(false);
    };
    fetchCampaign();
  }, [user, campaignId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Cargando campaña...</div>;
  }
  if (!campaign) {
    return <div className="text-center py-12 text-red-500">No se encontró la campaña.</div>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardCampaignTabs
          platforms={campaign.ad_platform || []}
          campaignData={{
            plataforma: '',
            objetivo: campaign.campaign_goal,
            duracion: campaign.duration,
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardCampaignPage;

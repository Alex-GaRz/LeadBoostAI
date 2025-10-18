import React, { useState, useEffect } from "react";
import BattlePlanWizard from "../features/hunting/components/BattlePlanWizard";
import HuntingDashboard from "../features/hunting/components/HuntingDashboard";
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const HuntingPage: React.FC = () => {
  const [missionId, setMissionId] = useState<string>("");
  const [userBusinessName, setUserBusinessName] = useState<string>('');
  const { user } = useAuth();

  // Esta función se pasará al wizard para actualizar el missionId cuando se cree una misión
  const handleMissionCreated = (newMissionId: string) => {
    setMissionId(newMissionId);
  };

  // useEffect para obtener el battle_plan y extraer el nombre de la empresa del usuario
  useEffect(() => {
    const fetchBattlePlan = async () => {
      if (!user?.uid || !missionId) return;
      
      try {
        const battlePlanRef = doc(db, `clients/${user.uid}/battle_plans/${missionId}`);
        const battlePlanSnap = await getDoc(battlePlanRef);
        
        if (battlePlanSnap.exists()) {
          const battlePlanData = battlePlanSnap.data();
          const businessName = battlePlanData?.business_name || 'Tu Empresa';
          setUserBusinessName(businessName);
        } else {
          console.warn('Battle plan not found, using default business name');
          setUserBusinessName('Tu Empresa');
        }
      } catch (error) {
        console.error('Error fetching battle plan:', error);
        setUserBusinessName('Tu Empresa');
      }
    };

    fetchBattlePlan();
  }, [user?.uid, missionId]);

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-text">Crear Nueva Misión de Caza</h1>
        <div className="text-base text-muted mb-8">Configurar Plan de Batalla</div>
        <div className="bg-white rounded-xl shadow p-8 mb-10">
          <BattlePlanWizard onMissionCreated={handleMissionCreated} />
        </div>
        {missionId && (
          <div className="mt-10">
            <HuntingDashboard 
              strategyId={missionId} 
              userBusinessName={userBusinessName}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HuntingPage;

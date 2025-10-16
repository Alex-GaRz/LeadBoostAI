import React from "react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Card from '../components/Dashboard/Card';
import AttackOrderModal from '../features/hunting/components/AttackOrderModal';
import Button from '../components/Dashboard/Button';
import Badge from '../components/Dashboard/Badge';
import { db } from '../firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';

const MissionDetailPage: React.FC = () => {
  const { missionId: strategyId } = useParams<{ missionId: string }>();
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
  // Métricas reales basadas en datos
  const metrics = {
    signals: opportunities.length,
    signalsSubtitle: 'Últimas 24 horas',
    profiles: opportunities.length,
    profilesSubtitle: 'Calificados para contacto',
    opportunities: opportunities.length,
    opportunitiesSubtitle: 'Listas para campaña',
  };

  useEffect(() => {
    if (!user?.uid || !strategyId) return;
    setIsLoading(true);
    const oppRef = collection(db, `clients/${user.uid}/battle_plans/${strategyId}/opportunities`);
    const unsubscribe = onSnapshot(oppRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          source: data.source || "N/A",
          signalText: data.signalText || "Sin señal",
          status: data.status || "PENDIENTE",
          targetProfile: {
            name: data.targetProfile?.name || "Prospecto Sin Nombre",
            jobTitle: data.targetProfile?.jobTitle || "Sin Cargo",
            companyName: data.targetProfile?.companyName || "Sin Empresa",
          },
          badge: data.badge || '',
        };
      });
      setOpportunities(docs);
      setIsLoading(false);
    }, () => {
      setOpportunities([]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid, strategyId]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
  <h1 className="text-3xl font-bold mb-8 text-text border-l-4 border-primary pl-3">Detalle de la Estrategia de Búsqueda</h1>
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="p-8 flex flex-col justify-center items-start">
          <div className="text-4xl font-bold text-primary mb-2">{metrics.signals}</div>
          <div className="text-lg font-semibold text-text mb-1">Señales Detectadas</div>
          <div className="text-sm text-muted">{metrics.signalsSubtitle}</div>
        </Card>
        <Card className="p-8 flex flex-col justify-center items-start">
          <div className="text-4xl font-bold text-primary mb-2">{metrics.profiles}</div>
          <div className="text-lg font-semibold text-text mb-1">Perfiles Identificados</div>
          <div className="text-sm text-muted">{metrics.profilesSubtitle}</div>
        </Card>
        <Card className="p-8 flex flex-col justify-center items-start">
          <div className="text-4xl font-bold text-primary mb-2">{metrics.opportunities}</div>
          <div className="text-lg font-semibold text-text mb-1">Oportunidades Calificadas</div>
          <div className="text-sm text-muted">{metrics.opportunitiesSubtitle}</div>
        </Card>
      </div>

      {/* Prospectos Encontrados */}
      <h2 className="text-xl font-bold mb-2 text-text">Prospectos Encontrados</h2>
  <div className="text-sm text-muted mb-6">Lista de prospectos calificados detectados por la configuración de búsqueda</div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Cargando oportunidades...</div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-8 text-muted">No se han encontrado oportunidades para esta misión todavía.</div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="flex flex-col md:flex-row items-center justify-between p-6">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-bold text-text">{opp.targetProfile?.name}</span>
                  {opp.badge && <Badge color="default" className="text-xs font-semibold">{opp.badge}</Badge>}
                </div>
                <div className="text-sm text-muted mb-1">{opp.targetProfile?.jobTitle} • {opp.targetProfile?.companyName}</div>
                <div className="text-sm text-accent mb-1"><span className="font-semibold">Señal detectada:</span> "{opp.signalText}"</div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto"
                  onClick={() => setSelectedOpportunity(opp)}
                >
                  Revisar y Actuar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Modal de acción restaurado */}
      {selectedOpportunity && (
        <AttackOrderModal
          opportunity={selectedOpportunity}
          strategyId={strategyId || ''}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
};

export default MissionDetailPage;

import React, { useEffect, useState } from "react";
import Button from '../../../components/Dashboard/Button';
import { Users } from 'lucide-react';
import AttackOrderModal from "./AttackOrderModal";
import { useAuth } from "../../../hooks/useAuth";
import { db } from "../../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

interface Opportunity {
  id: string;
  source: string;
  signalText: string;
  targetProfile: { 
    name: string; 
    jobTitle: string;
    companyName: string;
    linkedinURL?: string;
  };
  status: string;
  sourceURL?: string;
  detectedAt?: any;
  badge?: string;
}

interface OpportunityListProps {
  strategyId: string;
  showMetrics?: boolean;
  layout?: 'simple' | 'detailed';
  className?: string;
  userBusinessName?: string;
}

const OpportunityList: React.FC<OpportunityListProps> = ({ 
  strategyId, 
  showMetrics = true, 
  layout = 'simple',
  className = "",
  userBusinessName = 'Tu Empresa'
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  
  // ✅ Estado para selección múltiple
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  
  // Estados para el lanzamiento en lote
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

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
            linkedinURL: data.targetProfile?.linkedinURL || "",
          },
          sourceURL: data.sourceURL || "",
          detectedAt: data.detectedAt || "",
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

  // ✅ Funciones de selección múltiple
  const handleSelectOpportunity = (opportunityId: string) => {
    setSelectedOpportunities(prev => {
      if (prev.includes(opportunityId)) {
        return prev.filter(id => id !== opportunityId);
      } else {
        return [...prev, opportunityId];
      }
    });
  };

  const handleSelectAll = () => {
    const allOpportunityIds = opportunities.map(opp => opp.id);
    
    if (selectedOpportunities.length === opportunities.length) {
      setSelectedOpportunities([]);
    } else {
      setSelectedOpportunities(allOpportunityIds);
    }
  };

  const handleBatchLaunch = async () => {
    if (!user?.uid || !strategyId || selectedOpportunities.length === 0) {
      console.error('Faltan datos requeridos para el lanzamiento en lote');
      return;
    }
    // MOSTRAR PANTALLA DE CARGA INMEDIATAMENTE - METODO DIRECTO
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'batch-loading-overlay-hunting';
    loadingOverlay.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);">
          <div style="width: 60px; height: 60px; border: 4px solid #3b82f6; border-top: 4px solid transparent; border-radius: 50%; margin: 0 auto 1.5rem auto; animation: spin 1s linear infinite;"></div>
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem;">Generando Campañas...</h2>
          <p style="color: #6b7280; margin-bottom: 1.5rem;">Estamos creando tus campañas personalizadas. Esto tomará unos momentos.</p>
          <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 1rem;">Te redirigiremos automáticamente cuando estén listas</p>
        </div>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `;
    document.body.appendChild(loadingOverlay);

    try {
      setIsBatchLoading(true);
      setBatchError(null);

      // 1. Filtrar las oportunidades completas basándose en los IDs seleccionados
      const selectedOpportunityObjects = opportunities.filter(
        opportunity => selectedOpportunities.includes(opportunity.id)
      );

      console.log(`Iniciando lanzamiento en lote para ${selectedOpportunityObjects.length} prospectos...`);

      // 2. Llamar al endpoint del backend con timeout extendido
      const response = await axios.post('http://localhost:4000/api/execute-attack-batch', {
        opportunities: selectedOpportunityObjects,
        userId: user.uid,
        strategyId: strategyId
      }, {
        timeout: 300000, // 5 minutos de timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta completa del backend:', response);
      console.log('Status de respuesta:', response.status);
      console.log('Data de respuesta:', response.data);

      if (response.status === 200 && response.data.success) {
        // Éxito: el backend ha completado el procesamiento con Promise.all
        console.log('Lanzamiento en lote completado exitosamente:', response.data);
        
        // Extraer los resultados completos
        const resultsArray = response.data.results;
        
        // Limpiar selección después del éxito
        setSelectedOpportunities([]);
        
        // Remover pantalla de carga inmediatamente
        const overlay = document.getElementById('batch-loading-overlay-hunting');
        if (overlay) {
          overlay.remove();
        }
        setIsBatchLoading(false);
        
        // Navegar a la nueva página de resultados con los datos
        navigate(`/hunting/${strategyId}/results`, { 
          state: { results: resultsArray } 
        });
        
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }

    } catch (error: any) {
      console.error('Error en lanzamiento en lote:', error);
      console.error('Error completo:', {
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      // Remover pantalla de carga en caso de error
      const overlay = document.getElementById('batch-loading-overlay-hunting');
      if (overlay) {
        overlay.remove();
      }
      
      let errorMessage = 'Error desconocido al procesar el lote';
      
      if (error.response) {
        // El servidor respondió con un error
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Error del servidor: ${error.response.status}`;
      } else if (error.request) {
        // La petición se hizo pero no hubo respuesta
        errorMessage = 'Sin respuesta del servidor. Verifica que el backend esté corriendo.';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout
        errorMessage = 'Timeout: La generación de campañas está tomando más tiempo del esperado. Por favor espera un momento y verifica en "Campañas Generadas".';
      } else {
        // Error en la configuración de la petición
        errorMessage = error.message;
      }
      
      setBatchError(`Error: ${errorMessage}`);
      
      // Limpiar mensaje de error después de 15 segundos
      setTimeout(() => setBatchError(null), 15000);
      
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Variables para checkbox principal
  const isAllSelected = opportunities.length > 0 && selectedOpportunities.length === opportunities.length;
  const isIndeterminate = selectedOpportunities.length > 0 && selectedOpportunities.length < opportunities.length;

  // Métricas dinámicas
  const opportunitiesCount = opportunities.length;

  const renderMetrics = () => {
    if (!showMetrics) return null;

    if (layout === 'simple') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-brand-info rounded-xl p-6 text-center shadow">
            <div className="text-4xl font-bold text-brand-info-strong mb-2">{opportunitiesCount}</div>
            <div className="text-lg font-semibold text-brand-label">Señales Detectadas</div>
          </div>
          <div className="bg-brand-success rounded-xl p-6 text-center shadow">
            <div className="text-4xl font-bold text-brand-success-strong mb-2">{opportunitiesCount}</div>
            <div className="text-lg font-semibold text-brand-label">Perfiles Identificados</div>
          </div>
          <div className="bg-brand-accent rounded-xl p-6 text-center shadow">
            <div className="text-4xl font-bold text-brand-accent-strong mb-2">{opportunitiesCount}</div>
            <div className="text-lg font-semibold text-brand-label">Oportunidades Calificadas</div>
          </div>
          {selectedOpportunities.length > 0 && (
            <div className="bg-blue-500 rounded-xl p-6 text-center shadow">
              <div className="text-4xl font-bold text-white mb-2">{selectedOpportunities.length}</div>
              <div className="text-lg font-semibold text-white">Seleccionados</div>
            </div>
          )}
        </div>
      );
    }

    // Layout detailed - formato diferente para MissionDetailPage
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{opportunitiesCount}</div>
          <div className="text-sm text-blue-800">Señales Detectadas</div>
          <div className="text-xs text-blue-600">Últimas 24 horas</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{opportunitiesCount}</div>
          <div className="text-sm text-green-800">Perfiles Calificados</div>
          <div className="text-xs text-green-600">Listos para contacto</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">{selectedOpportunities.length}</div>
          <div className="text-sm text-purple-800">Seleccionados</div>
          <div className="text-xs text-purple-600">Para campaña</div>
        </div>
      </div>
    );
  };

  const renderOpportunityCard = (opp: Opportunity) => {
    if (layout === 'simple') {
      return (
        <div key={opp.id} className="bg-brand-bg rounded-xl shadow p-6 flex items-center">
          <div className="flex-shrink-0 mr-4">
            <input
              type="checkbox"
              checked={selectedOpportunities.includes(opp.id)}
              onChange={() => handleSelectOpportunity(opp.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="flex-1 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1">
              <div className="text-xl font-bold text-brand-base mb-1">{opp.targetProfile?.name}</div>
              <div className="text-sm text-brand-label mb-2">{opp.targetProfile?.jobTitle}</div>
              <div className="text-base text-brand-text mb-2">{opp.signalText}</div>
              <div className="text-xs text-brand-info font-semibold mb-2">Fuente: {opp.source}</div>
              <div className="inline-block px-3 py-1 rounded-full bg-brand-muted text-xs font-bold text-brand-label">{opp.status}</div>
            </div>
            <div className="mt-4 md:mt-0 md:ml-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedOpportunity(opp)}
                className="w-full md:w-auto"
              >
                Revisar y Actuar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Layout detailed para MissionDetailPage
    return (
      <div key={opp.id} className="bg-white rounded-lg shadow p-6 flex items-center hover:shadow-md transition-shadow">
        <div className="flex-shrink-0 mr-4">
          <input
            type="checkbox"
            checked={selectedOpportunities.includes(opp.id)}
            onChange={() => handleSelectOpportunity(opp.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{opp.targetProfile?.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{opp.targetProfile?.jobTitle} en {opp.targetProfile?.companyName}</p>
              <p className="text-gray-800 mb-3">{opp.signalText}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {opp.source}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {opp.status}
                </span>
                {opp.badge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {opp.badge}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-6">
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedOpportunity(opp)}
              >
                Revisar y Actuar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <div className="mt-2">Cargando oportunidades...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Botón de Acción en Bloque */}
      {selectedOpportunities.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                {selectedOpportunities.length} prospecto{selectedOpportunities.length !== 1 ? 's' : ''} seleccionado{selectedOpportunities.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleBatchLaunch}
              disabled={isBatchLoading}
            >
              {isBatchLoading 
                ? 'Procesando campañas...' 
                : `Generar Campañas para (${selectedOpportunities.length}) Prospectos Seleccionados`
              }
            </Button>
          </div>
        </div>
      )}

      {/* Notificaciones de éxito y error */}

      
      {batchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-red-600 mt-0.5">❌</div>
            <div>
              <p className="text-red-800 font-medium">{batchError}</p>
              <p className="text-red-700 text-sm mt-1">
                Por favor, intenta nuevamente o contacta al soporte si el problema persiste.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas */}
      {renderMetrics()}

      {/* Lista de Oportunidades */}
      {opportunities.length === 0 ? (
        <div className="text-center py-8 text-brand-muted">
          No se han encontrado oportunidades para esta misión todavía.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cabecera con checkbox principal */}
          <div className="bg-white rounded-lg shadow p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isIndeterminate;
                      }
                    }}
                  />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  Prospectos Pendientes ({opportunities.length})
                </h2>
              </div>
              {selectedOpportunities.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedOpportunities.length} seleccionados
                </span>
              )}
            </div>
          </div>

          {/* Renderizar las tarjetas */}
          {opportunities.map(renderOpportunityCard)}
        </div>
      )}

      {/* Modal de acción */}
      {selectedOpportunity && (
        <AttackOrderModal
          opportunity={selectedOpportunity}
          strategyId={strategyId}
          onClose={() => setSelectedOpportunity(null)}
          userBusinessName={userBusinessName}
        />
      )}


    </div>
  );
};

export default OpportunityList;
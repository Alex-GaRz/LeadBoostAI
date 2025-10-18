import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { Settings, Clock, MapPin, Target, Zap, Shield } from 'lucide-react';

interface RadarConfig {
  platforms: string[];
  keywords: string[];
  targetAudience: string;
  geoLocation: string;
  industry: string;
  companySize: string;
  technologies: string[];
  exclusions: string[];
  monitoringFrequency: string;
  lastUpdated: Timestamp;
}

interface StrategyConfigurationProps {
  strategyId: string;
  userId: string;
  onConfigUpdate?: (config: RadarConfig) => void;
}

const StrategyConfiguration: React.FC<StrategyConfigurationProps> = ({
  strategyId,
  userId,
  onConfigUpdate
}) => {
  const [config, setConfig] = useState<RadarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Cargar configuración actual
  useEffect(() => {
    const loadConfig = async () => {
      if (!userId || !strategyId) return;

      try {
        setIsLoading(true);
        const docRef = doc(db, `clients/${userId}/battle_plans/${strategyId}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const radarConfig: RadarConfig = {
            platforms: data.radarConfig?.platforms || ['LinkedIn', 'Twitter'],
            keywords: data.radarConfig?.keywords || [],
            targetAudience: data.radarConfig?.targetAudience || '',
            geoLocation: data.radarConfig?.geoLocation || '',
            industry: data.radarConfig?.industry || '',
            companySize: data.radarConfig?.companySize || '',
            technologies: data.radarConfig?.technologies || [],
            exclusions: data.radarConfig?.exclusions || [],
            monitoringFrequency: data.radarConfig?.monitoringFrequency || 'daily',
            lastUpdated: data.radarConfig?.lastUpdated || Timestamp.now()
          };
          setConfig(radarConfig);
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [userId, strategyId]);

  // Guardar configuración (debounced)
  const saveConfig = useCallback(async (newConfig: RadarConfig) => {
    if (!userId || !strategyId) return;

    try {
      setIsSaving(true);
      const docRef = doc(db, `clients/${userId}/battle_plans/${strategyId}`);
      
      const updatedConfig = {
        ...newConfig,
        lastUpdated: Timestamp.now()
      };

      await updateDoc(docRef, {
        radarConfig: updatedConfig
      });

      setLastSaved(new Date());
      onConfigUpdate?.(updatedConfig);
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, strategyId, onConfigUpdate]);

  // Handlers para actualizar campos
  const updateField = (field: keyof RadarConfig, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    
    // Auto-save después de 2 segundos
    const timeoutId = setTimeout(() => {
      saveConfig(newConfig);
    }, 2000);

    return () => clearTimeout(timeoutId);
  };

  const addArrayItem = (field: 'keywords' | 'technologies' | 'exclusions', item: string) => {
    if (!config || !item.trim()) return;
    
    const currentArray = config[field] || [];
    if (!currentArray.includes(item.trim())) {
      updateField(field, [...currentArray, item.trim()]);
    }
  };

  const removeArrayItem = (field: 'keywords' | 'technologies' | 'exclusions', item: string) => {
    if (!config) return;
    
    const currentArray = config[field] || [];
    updateField(field, currentArray.filter(i => i !== item));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error al cargar configuración
        </h3>
        <p className="text-gray-600">
          No se pudo cargar la configuración del radar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Configuración del Radar
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Ajusta los parámetros de búsqueda y monitoreo
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isSaving && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                Guardando...
              </div>
            )}
            
            {lastSaved && !isSaving && (
              <div className="flex items-center text-sm text-green-600">
                <Clock className="h-4 w-4 mr-1" />
                Guardado {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuración básica */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-indigo-600" />
          Audiencia Objetivo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audiencia Principal
            </label>
            <textarea
              value={config.targetAudience}
              onChange={(e) => updateField('targetAudience', e.target.value)}
              placeholder="Describe tu audiencia objetivo..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Ubicación Geográfica
            </label>
            <input
              type="text"
              value={config.geoLocation}
              onChange={(e) => updateField('geoLocation', e.target.value)}
              placeholder="Ej: México, Estados Unidos, Global"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industria
            </label>
            <select
              value={config.industry}
              onChange={(e) => updateField('industry', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccionar industria</option>
              <option value="tecnologia">Tecnología</option>
              <option value="salud">Salud</option>
              <option value="finanzas">Finanzas</option>
              <option value="educacion">Educación</option>
              <option value="retail">Retail</option>
              <option value="manufactura">Manufactura</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño de Empresa
            </label>
            <select
              value={config.companySize}
              onChange={(e) => updateField('companySize', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Cualquier tamaño</option>
              <option value="startup">Startup (1-10)</option>
              <option value="small">Pequeña (11-50)</option>
              <option value="medium">Mediana (51-200)</option>
              <option value="large">Grande (201-1000)</option>
              <option value="enterprise">Empresa (1000+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Plataformas y monitoreo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-indigo-600" />
          Monitoreo y Plataformas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plataformas a Monitorear
            </label>
            <div className="space-y-2">
              {['LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'YouTube'].map(platform => (
                <label key={platform} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.platforms.includes(platform)}
                    onChange={(e) => {
                      const newPlatforms = e.target.checked
                        ? [...config.platforms, platform]
                        : config.platforms.filter(p => p !== platform);
                      updateField('platforms', newPlatforms);
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{platform}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia de Monitoreo
            </label>
            <select
              value={config.monitoringFrequency}
              onChange={(e) => updateField('monitoringFrequency', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="realtime">Tiempo Real</option>
              <option value="hourly">Cada Hora</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Keywords y exclusiones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-indigo-600" />
          Palabras Clave y Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palabras Clave
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {config.keywords.map(keyword => (
                  <span
                    key={keyword}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {keyword}
                    <button
                      onClick={() => removeArrayItem('keywords', keyword)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Agregar palabra clave..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem('keywords', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
          
          {/* Exclusions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palabras de Exclusión
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {config.exclusions.map(exclusion => (
                  <span
                    key={exclusion}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    {exclusion}
                    <button
                      onClick={() => removeArrayItem('exclusions', exclusion)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Agregar exclusión..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addArrayItem('exclusions', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyConfiguration;
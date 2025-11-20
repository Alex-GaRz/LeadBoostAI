import { getAuth } from 'firebase/auth';

// Asegúrate de que este puerto coincida con el de uvicorn (8000)
const API_BASE_URL = 'http://localhost:8000';

// Definición del tipo de datos que devuelve el Bloque 9
export interface DashboardSnapshot {
  meta: {
    user: string;
    mode: string;
    status: string;
  };
  radar: {
    health_score: number;
    active_alerts: Array<{
      id: string;
      type: string;
      severity: string;
      message: string;
      timestamp: string;
    }>;
  };
  operations: {
    governance: {
      budget_remaining: number;
      approval_status: string;
    };
    execution: Array<{
      id: string;
      platform: string;
      status: string;
      spend: number;
      roas: number;
    }>;
  };
}

/**
 * Obtiene el Snapshot unificado del BFF usando el Token de Firebase.
 */
export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuario no autenticado. No se puede conectar al BFF.");
  }

  // 1. Obtener Token JWT (fuerza refresh si es necesario)
  const token = await user.getIdToken();

  // 2. Llamada al BFF Python
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/snapshot`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // <--- AQUÍ VA LA LLAVE DE SEGURIDAD
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Sesión expirada o inválida (401).");
      if (response.status === 403) throw new Error("Acceso denegado por políticas de seguridad (403).");
      throw new Error(`Error del Servidor BFF: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error conectando con LeadBoost BFF:", error);
    throw error;
  }
};
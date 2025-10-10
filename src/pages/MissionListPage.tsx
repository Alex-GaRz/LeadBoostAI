import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

interface BattlePlan {
  id: string;
  planName: string;
  [key: string]: any;
}

const MissionListPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<BattlePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!user?.uid) return;
      setLoading(true);
      const plansRef = collection(db, `clients/${user.uid}/battle_plans`);
      const snapshot = await getDocs(plansRef);
      const plansList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BattlePlan));
      setPlans(plansList);
      setLoading(false);
    };
    fetchPlans();
  }, [user?.uid]);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Misiones de Caza</h1>
      <div className="mb-6">
        <Link to="/hunting/new" className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition">
          [+ Nueva Misión]
        </Link>
      </div>
      {loading ? (
        <div className="text-gray-500">Cargando misiones...</div>
      ) : plans.length === 0 ? (
        <div className="text-gray-500">No hay misiones registradas.</div>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="text-left px-4 py-2">Nombre de Misión</th>
              <th className="text-left px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(plan => (
              <tr key={plan.id} className="border-b">
                <td className="px-4 py-2">{plan.planName}</td>
                <td className="px-4 py-2">
                  <Link to={`/hunting/${plan.id}`} className="text-blue-600 hover:underline font-semibold">
                    [Ver Detalles]
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MissionListPage;

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from '../components/Dashboard/Card';
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
      <h1 className="text-heading-2 font-bold mb-6 text-text">Panel de Misiones de Caza</h1>
      <div className="mb-6">
        <Link
          to="/hunting/new"
          className="inline-flex items-center justify-center font-semibold rounded-lg bg-primary text-white px-5 py-2 text-body hover:bg-accent transition"
        >
          + Nueva Misión
        </Link>
      </div>
      {loading ? (
        <Card className="text-label text-center">Cargando misiones...</Card>
      ) : plans.length === 0 ? (
        <Card className="text-label text-center">No hay misiones registradas.</Card>
      ) : (
        <Card className="p-0">
          <table className="w-full rounded-xl">
            <thead>
              <tr>
                <th className="text-label text-sm font-semibold py-3 px-4 text-left">Nombre de Misión</th>
                <th className="text-label text-sm font-semibold py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} className="border-b border-border">
                  <td className="px-4 py-2 text-body">{plan.planName}</td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/hunting/${plan.id}`}
                      className="inline-flex items-center justify-center font-semibold rounded-lg bg-secondary text-text px-5 py-2 text-body hover:bg-card transition"
                    >
                      Ver Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default MissionListPage;

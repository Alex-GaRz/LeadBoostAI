import React, { useState } from 'react';
import { updateUserProfile } from '../firebase/firestoreService';
import { useAuth } from '../hooks/useAuth';

interface PostRegisterFormProps {
  onComplete?: () => void;
}

const PostRegisterForm: React.FC<PostRegisterFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    companyName: '',
    phoneNumber: '',
    companySector: '',
    country: '',
    numberOfEmployees: '',
  userName: '',
  userRole: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!user?.uid) throw new Error('Usuario no autenticado');
      await updateUserProfile(user.uid, {
        ...form,
        displayName: form.companyName,
  userName: form.userName,
  userRole: form.userRole,
        email: user.email,
        numberOfEmployees: Number(form.numberOfEmployees),
        updatedAt: new Date(),
        profileCompleted: true,
      });
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Completa tu perfil</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                id="userName"
                name="userName"
                type="text"
                required
                value={form.userName}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Número de teléfono</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                pattern="[0-9]+"
                required
                value={form.phoneNumber}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Número de teléfono"
              />
            </div>
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Nombre de la empresa</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={form.companyName}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre de la empresa"
              />
            </div>
            <div>
              <label htmlFor="companySector" className="block text-sm font-medium text-gray-700">Sector de la empresa</label>
              <input
                id="companySector"
                name="companySector"
                type="text"
                required
                value={form.companySector}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Sector de la empresa"
              />
            </div>
            <div>
              <label htmlFor="numberOfEmployees" className="block text-sm font-medium text-gray-700">Número de empleados</label>
              <input
                id="numberOfEmployees"
                name="numberOfEmployees"
                type="number"
                min={1}
                required
                value={form.numberOfEmployees}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Número de empleados"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
              <input
                id="country"
                name="country"
                type="text"
                required
                value={form.country}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="País"
              />
            </div>
            <div>
              <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">Rol o cargo</label>
              <input
                id="userRole"
                name="userRole"
                type="text"
                required
                value={form.userRole}
                onChange={handleChange}
                className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Rol o cargo"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Guardando...' : 'Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostRegisterForm;

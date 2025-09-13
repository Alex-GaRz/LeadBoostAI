import React, { useState } from 'react';
import PostRegisterForm from './PostRegisterForm';
import IncrementyLogo from '../assets/Incrementy-logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Chrome } from 'lucide-react';
import { registerWithEmail, loginWithEmail, loginWithGoogle, AuthError } from '../firebase/authService';
import { updateUserProfile } from '../firebase/firestoreService';

interface AuthFormProps {
  type: 'login' | 'register';
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPostRegisterForm, setShowPostRegisterForm] = useState(false);
  const navigate = useNavigate();

  const isLogin = type === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        navigate('/dashboard');
      } else {
        const userCredential = await registerWithEmail(email, password);
        // Guardar el nombre completo como displayName y el email en Firestore
        await updateUserProfile(userCredential.user.uid, { displayName: name, email });
        navigate('/post-register');
        // No navegar aquí, solo mostrar el formulario post-registro
      }
    } catch (err: any) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      const authError = err as AuthError;
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar el formulario post-registro solo si es registro y showPostRegisterForm está activo
  if (!isLogin && showPostRegisterForm) {
    return <PostRegisterForm onComplete={() => navigate('/dashboard')} />;
  }

  // Siempre mostrar el formulario de autenticación si no se cumple la condición anterior
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12">
      <div className="w-full max-w-md">
        {/* Logo de Incrementy */}
        <div className="flex justify-center mb-8">
          <img src={IncrementyLogo} alt="Logo" className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-semibold text-black text-center mb-2">
          {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-black">
          {isLogin
            ? (<>
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="font-semibold text-[#2563eb] underline">Crear cuenta</Link>
              </>)
            : (<>
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="font-semibold text-[#2563eb] underline">Iniciar sesión</Link>
              </>)}
        </p>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md font-semibold">
            {error}
          </div>
        )}
        <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-black">
              Correo electrónico
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 text-black font-semibold focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-black focus:border-black"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-black">
              Contraseña
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 text-black font-semibold focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-black focus:border-black"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-[#2563eb] rounded-md text-sm font-semibold text-white bg-[#2563eb] hover:bg-blue-700 transition-colors"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </div>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm font-semibold text-black">
              <span className="px-2 bg-white">O continúa con</span>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-black rounded-md bg-white text-sm font-semibold text-black hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Chrome className="h-5 w-5 text-red-500 mr-2" />
              Continuar con Google
            </button>
          </div>
        </div>
        {isLogin && (
          <div className="mt-6 text-center">
            <Link
              to="#"
              className="text-sm font-semibold text-[#2563eb] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        )}
      </div>
    </div>
);
}

export default AuthForm;
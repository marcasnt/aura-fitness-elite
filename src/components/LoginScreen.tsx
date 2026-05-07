import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, User as UserIcon, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { signIn } from '../lib/auth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const hasSupabaseConfig = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!hasSupabaseConfig) {
      setError('Supabase no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env');
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (type: 'coach' | 'client1' | 'client2') => {
    if (type === 'coach') {
      setEmail('marcasnt@gmail.com');
      setPassword('');
    } else if (type === 'client1') {
      setEmail('carlos@aura.com');
      setPassword('');
    } else if (type === 'client2') {
      setEmail('valeria@aura.com');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium Background Lighting Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#d4f826] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#bba15c] opacity-[0.03] rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#121214] border border-[#27272a] rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10 transition-all duration-300 hover:border-[#3f3f46]">
        
        {/* Luxury Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br from-[#1e1e24] to-[#2a2a32] border border-[#3f3f46] text-[#d4f826] mb-3 shadow-md">
            <Dumbbell className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-widest text-white font-mono">
            AURA <span className="text-[#d4f826] font-sans font-light">//</span> ELITE
          </h1>
          <p className="text-[#a1a1aa] text-xs uppercase tracking-widest mt-1">
            Plataforma de Alta Performance & Seguimiento
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-[#18181b] border-l-2 border-[#d4f826] p-3 rounded-r-lg mb-6 text-xs text-[#a1a1aa] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#d4f826] shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-semibold">Acceso Inteligente:</span> Ingresa con tus credenciales de Coach para gestionar clientes y rutinas, o con tu cuenta de atleta.
          </div>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] mb-1.5 font-semibold">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#71717a]">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@aura.com"
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4f826] focus:ring-1 focus:ring-[#d4f826] transition-all placeholder-[#52525b]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#a1a1aa] mb-1.5 font-semibold">
              Contraseña Premium
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#71717a]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4f826] focus:ring-1 focus:ring-[#d4f826] transition-all placeholder-[#52525b]"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 p-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4f826] text-black font-semibold text-sm py-3 px-4 rounded-xl hover:bg-[#e2fa52] focus:outline-none transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#d4f826]/10 font-mono tracking-wide mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                INGRESAR AL SISTEMA <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Toggles for Luxury UX Demonstration */}
        <div className="mt-8 pt-6 border-t border-[#27272a]">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#71717a] mb-3">
            <Sparkles className="w-3 h-3 text-[#d4f826]" />
            <span>ACCESO RÁPIDO PARA PRUEBAS (1-CLICK)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fillQuickCredentials('coach')}
              className="bg-[#18181b] border border-[#27272a] hover:border-[#d4f826]/40 p-2 rounded-xl text-[11px] text-center transition-all hover:bg-[#1f1f23]"
            >
              <span className="block font-bold text-[#d4f826] font-mono">COACH</span>
              <span className="text-[9px] text-[#71717a]">marcasnt</span>
            </button>
            <button
              onClick={() => fillQuickCredentials('client1')}
              className="bg-[#18181b] border border-[#27272a] hover:border-[#e5ba73]/40 p-2 rounded-xl text-[11px] text-center transition-all hover:bg-[#1f1f23]"
            >
              <span className="block font-bold text-white font-mono">CLIENTE 1</span>
              <span className="text-[9px] text-[#71717a]">Carlos M.</span>
            </button>
            <button
              onClick={() => fillQuickCredentials('client2')}
              className="bg-[#18181b] border border-[#27272a] hover:border-[#a1a1aa] p-2 rounded-xl text-[11px] text-center transition-all hover:bg-[#1f1f23]"
            >
              <span className="block font-bold text-white font-mono">CLIENTE 2</span>
              <span className="text-[9px] text-[#71717a]">Valeria G.</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-[#52525b]">
            Diseño Minimalista de Lujo • Cifrado Seguro de Extremo a Extremo
          </p>
        </div>
      </div>
    </div>
  );
};

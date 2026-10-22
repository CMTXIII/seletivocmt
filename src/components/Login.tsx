import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, LogIn } from 'lucide-react';

const API_URL = 'https://gille3470.c35.integrator.host';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, { cpf, password });
      onLoginSuccess(response.data.user);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao realizar login. Verifique o CPF e a Senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-b-4 border-[#ffcc00]">
        <div className="bg-[#002b66] text-white p-6 text-center space-y-2">
          <div className="w-20 h-20 bg-white rounded-full p-1.5 mx-auto flex items-center justify-center border-2 border-[#ffcc00] shadow-md">
            <img src={`${import.meta.env.BASE_URL}Logo_CMT_XIII.png`} alt="Logo CMT XIII" className="w-full h-full object-contain" />
          </div>
          <h1 
            style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }} 
            className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wide"
          >
            Área Administrativa
          </h1>
          <p className="text-xs text-[#ffcc00] font-bold">Colégio Militar Tiradentes XIII</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">CPF (Usuário) *</label>
            <div className="relative flex items-center">
              <User className="w-5 h-5 text-gray-400 absolute left-3.5 z-10 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                className="w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#002b66] outline-none font-medium shadow-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Senha *</label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 z-10 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                className="w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#002b66] outline-none font-medium shadow-sm bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#002b66] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-900 shadow-lg transition cursor-pointer"
          >
            {loading ? 'Acessando...' : <><LogIn className="w-4 h-4" /> Acessar Sistema</>}
          </button>
        </form>
      </div>
    </div>
  );
};
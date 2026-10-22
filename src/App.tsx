import { useState } from 'react';
import { FormInscricao } from './components/FormInscricao';
import { Login } from './components/Login';
import { Adm } from './components/Adm';

export function App() {
  const [route, setRoute] = useState<'form' | 'login' | 'adm'>(() => {
    const path = window.location.pathname;
    const search = window.location.search;

    return path.includes('/adm') || search.includes('adm=1') ? 'login' : 'form';
  });
  const [user, setUser] = useState<any>(null);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setRoute('adm');
  };

  const handleLogout = () => {
    setUser(null);
    setRoute('form');
    window.history.pushState({}, '', '/');
  };

  const navigateToAdm = () => {
    window.history.pushState({}, '', '/adm');
    if (user) {
      setRoute('adm');
    } else {
      setRoute('login');
    }
  };

  return (
    <div className="relative">
      {/* Botão de Acesso Administrativo no Canto Superior para facilitar testes */}
      {route === 'form' && (
        <button
          onClick={navigateToAdm}
          className="fixed top-3 right-3 bg-[#002b66] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-xl z-50 hover:bg-blue-900 border border-[#ffcc00] transition"
        >
          Área ADM
        </button>
      )}

      {route === 'form' && <FormInscricao />}
      {route === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
      {route === 'adm' && user && <Adm onLogout={handleLogout} />}
    </div>
  );
}

export default App;
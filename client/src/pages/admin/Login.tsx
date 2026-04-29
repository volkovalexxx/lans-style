import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/admin/login', { login, password });
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin');
    } catch {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold text-center mb-8">
          Lans Style
        </h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-center mb-2">Вход в админ-панель</h2>

          <input
            type="text"
            placeholder="Логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882]"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882]"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

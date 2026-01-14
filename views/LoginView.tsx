import React, { useState } from 'react';
import { Lock, User, ShieldCheck, CalendarClock, CreditCard, Info } from 'lucide-react';
import { Lecturer, UserRole } from '../types';

interface LoginViewProps {
  lecturers: Lecturer[];
  onLogin: (id: string, name: string, role: UserRole) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ lecturers, onLogin }) => {
  const [roleTab, setRoleTab] = useState<UserRole>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (roleTab === 'admin') {
      if (username === 'admin' && password === 'admin') {
        onLogin('admin-1', 'Administrator', 'admin');
      } else {
        setError('Username atau password salah (Coba: admin/admin)');
      }
    } else {
      // Logic Login Dosen: Username = NIP, Password = NIP
      // Cari dosen berdasarkan NIP yang dimasukkan
      const lecturer = lecturers.find(l => l.nip === username);

      // Validasi: Dosen ditemukan DAN password yang dimasukkan sama dengan NIP
      if (lecturer && password === lecturer.nip) {
        onLogin(lecturer.id, lecturer.name, 'lecturer');
      } else {
        setError('Login gagal. Pastikan NIP terdaftar dan Password adalah NIP Anda.');
      }
    }
  };

  // Reset inputs when switching tabs
  const switchTab = (tab: UserRole) => {
    setRoleTab(tab);
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
            <CalendarClock size={40} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">SIMPDB</h1>
          <p className="text-slate-400 text-sm mt-1">Sistem Informasi Manajemen<br/>Penjadwalan Kuliah</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => switchTab('admin')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              roleTab === 'admin' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck size={18} /> Admin
          </button>
          <button
            onClick={() => switchTab('lecturer')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              roleTab === 'lecturer' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <User size={18} /> Dosen
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {roleTab === 'admin' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Username (admin)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Password (admin)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan NIP Anda"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <CreditCard size={18} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan NIP sebagai Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 items-start">
                  <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Gunakan <strong>NIP</strong> Anda sebagai Username dan Password untuk masuk ke Portal Dosen.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center animate-pulse border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-blue-200"
            >
              {roleTab === 'admin' ? 'Masuk sebagai Admin' : 'Masuk ke Portal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
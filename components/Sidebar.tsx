import React from 'react';
import { LayoutDashboard, BookOpen, Users, Building2, Calendar, Menu, X, UserCheck, LogOut, CalendarClock, Activity, Settings, Layers } from 'lucide-react';
import { ViewState, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  userRole: UserRole;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, userRole, onChangeView, isOpen, toggleSidebar, onLogout }) => {
  const adminMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'schedule', label: 'Jadwal Kuliah', icon: Calendar },
    { id: 'courses', label: 'Mata Kuliah', icon: BookOpen },
    { id: 'lecturers', label: 'Dosen', icon: Users },
    { id: 'rooms', label: 'Ruangan', icon: Building2 },
    { id: 'classes', label: 'Data Kelas', icon: Layers },
    { id: 'settings', label: 'Koneksi Database', icon: Settings },
  ];

  const lecturerMenu = [
     { id: 'portal', label: 'Portal Dosen', icon: UserCheck },
  ];

  const activeMenu = userRole === 'admin' ? adminMenu : lecturerMenu;

  const navClass = (id: string) => `
    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer mb-1
    ${currentView === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
  `;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CalendarClock size={20} className="text-white" />
            </div>
            SIMPDB
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">
            Menu {userRole === 'admin' ? 'Admin' : 'Dosen'}
          </div>
          {activeMenu.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onChangeView(item.id as ViewState);
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={navClass(item.id)}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}

          {userRole === 'admin' && (
             <div className="mt-8 mb-4 px-4">
               <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Akses Dosen
              </div>
              <div
                onClick={() => {
                  onChangeView('portal');
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={navClass('portal')}
              >
                <UserCheck size={20} />
                <span className="font-medium">Portal Dosen</span>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
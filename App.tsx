
import React, { useState, useEffect } from 'react';
import { Menu, BookOpen, Users, Building2, Calendar, LayoutDashboard, CalendarClock, Database, Loader2, Layers, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import DataManager from './views/DataManager';
import ScheduleView from './views/ScheduleView';
import MonitoringView from './views/MonitoringView';
import LecturerPortal from './views/LecturerPortal';
import LoginView from './views/LoginView';
import SettingsView from './views/SettingsView';
import { Course, Lecturer, Room, ScheduleItem, ViewState, User, UserRole, ClassName } from './types';

// URL Realtime terbaru yang diberikan pengguna
const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzNfz5NTiRSmcC9nreKjJ-GJcbUVYtqhCpWpRPixcqGq0ubUwFcqOZjJHd0MB86S7IE9g/exec';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [errorSync, setErrorSync] = useState<string | null>(null);

  // Inisialisasi state dengan array kosong (tanpa dummy data)
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [classNames, setClassNames] = useState<ClassName[]>([]);
  
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('simpdb_sheet_url') || DEFAULT_SHEET_URL);

  const fetchFromSheets = async (url: string) => {
    if (!url) return;
    setIsSyncing(true);
    setErrorSync(null);
    try {
      let cleanUrl = url.trim();
      // Append timestamp to bypass cache
      const separator = cleanUrl.includes('?') ? '&' : '?';
      const fetchUrl = `${cleanUrl}${separator}t=${new Date().getTime()}`;

      // Menggunakan default fetch (tanpa mode: cors eksplisit yang kadang bermasalah dengan redirect GAS)
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Respon bukan JSON. Cek URL atau izin akses (harus 'Anyone').");
      }
      
      const data = await response.json();
      
      if (data) {
        if (data.courses) {
           // Pastikan credits adalah number
           setCourses(data.courses.map((c: any) => ({
             ...c,
             credits: Number(c.credits) || 0
           })));
        }
        if (data.lecturers) setLecturers(data.lecturers);
        if (data.rooms) {
           // Pastikan capacity adalah number
           setRooms(data.rooms.map((r: any) => ({
             ...r,
             capacity: Number(r.capacity) || 0
           })));
        }
        if (data.schedule) setSchedule(data.schedule);
        if (data.classes && data.classes.length > 0) setClassNames(data.classes);
        setApiConnected(true);
        setErrorSync(null);
      }
    } catch (error: any) {
      console.error("Sheets sync error:", error);
      setApiConnected(false);
      
      let msg = error.message;
      if (msg === 'Failed to fetch') {
        msg = "Gagal terhubung: Cek koneksi internet atau URL Script.";
      }
      setErrorSync(msg);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Generate default classes PDB01-125 initially in case backend doesn't provide them
    const defaultClasses = Array.from({ length: 125 }, (_, i) => ({ id: `cls-${i+1}`, name: `PDB${(i+1).toString().padStart(2, '0')}` }));
    setClassNames(defaultClasses);

    if (sheetUrl) {
      fetchFromSheets(sheetUrl);
    } else {
      setIsLoading(false);
    }

    const storedSession = localStorage.getItem('simpdb_session');
    if (storedSession) {
      try {
        const user = JSON.parse(storedSession);
        setCurrentUser(user);
        const savedView = localStorage.getItem('simpdb_last_view');
        if (savedView) setCurrentView(savedView as ViewState);
      } catch (e) {
        localStorage.removeItem('simpdb_session');
      }
    }
  }, []);

  const handleSaveSheetUrl = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem('simpdb_sheet_url', url);
    fetchFromSheets(url);
  };

  const handleLogin = (id: string, name: string, role: UserRole) => {
    const user = { id, name, role };
    setCurrentUser(user);
    localStorage.setItem('simpdb_session', JSON.stringify(user));
    setCurrentView(role === 'admin' ? 'dashboard' : 'portal');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('simpdb_session');
    setCurrentView('dashboard');
  };

  // Generic Sync Function
  const syncData = async (action: 'add' | 'delete' | 'update', table: string, payload: any) => {
    if (apiConnected && sheetUrl) {
      setIsSyncing(true);
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ 
            action, 
            table, 
            data: payload,
            id: payload.id // Send ID at root level for delete convenience if supported
          })
        });
      } catch(e) {
        console.error("Sync error:", e);
      } finally { 
        setIsSyncing(false); 
      }
    }
  };

  // Helper for Bulk Import Sync (Optimized for Batch Insert)
  const bulkSyncData = async (table: string, items: any[]) => {
    if (!apiConnected || !sheetUrl) return;
    
    setIsSyncing(true);
    try {
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ 
            action: 'bulk_add', // Menggunakan endpoint bulk_add baru di GAS
            table, 
            data: items 
          })
        });
    } catch(e) {
      console.error("Bulk sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // CRUD Handlers
  const handleAddCourse = (item: Omit<Course, 'id'>) => {
    const newItem = { ...item, id: `c-${Date.now()}` };
    setCourses(prev => [...prev, newItem]);
    syncData('add', 'courses', newItem);
  };
  const handleDeleteCourse = (id: string) => {
    setCourses(prev => prev.filter(i => i.id !== id));
    syncData('delete', 'courses', { id });
  };
  const handleImportCourses = (items: Omit<Course, 'id'>[]) => {
    const newItems = items.map((item, index) => ({
      ...item,
      id: `c-imp-${Date.now()}-${index}`
    }));
    setCourses(prev => [...prev, ...newItems]);
    bulkSyncData('courses', newItems);
  };

  const handleAddLecturer = (item: Omit<Lecturer, 'id'>) => {
    const newItem = { ...item, id: `l-${Date.now()}` };
    setLecturers(prev => [...prev, newItem]);
    syncData('add', 'lecturers', newItem);
  };
  const handleDeleteLecturer = (id: string) => {
    setLecturers(prev => prev.filter(i => i.id !== id));
    syncData('delete', 'lecturers', { id });
  };
  const handleImportLecturers = (items: Omit<Lecturer, 'id'>[]) => {
    const newItems = items.map((item, index) => ({
      ...item,
      id: `l-imp-${Date.now()}-${index}`
    }));
    setLecturers(prev => [...prev, ...newItems]);
    bulkSyncData('lecturers', newItems);
  };

  const handleAddRoom = (item: Omit<Room, 'id'>) => {
    const newItem = { ...item, id: `r-${Date.now()}` };
    setRooms(prev => [...prev, newItem]);
    syncData('add', 'rooms', newItem);
  };
  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(i => i.id !== id));
    syncData('delete', 'rooms', { id });
  };
  const handleImportRooms = (items: Omit<Room, 'id'>[]) => {
    const newItems = items.map((item, index) => ({
      ...item,
      id: `r-imp-${Date.now()}-${index}`
    }));
    setRooms(prev => [...prev, ...newItems]);
    bulkSyncData('rooms', newItems);
  };

  const handleAddClass = (item: Omit<ClassName, 'id'>) => {
    const newItem = { ...item, id: `cls-${Date.now()}` };
    setClassNames(prev => [...prev, newItem]);
    syncData('add', 'classes', newItem);
  };
  const handleDeleteClass = (id: string) => {
    setClassNames(prev => prev.filter(i => i.id !== id));
    syncData('delete', 'classes', { id });
  };
  const handleImportClasses = (items: Omit<ClassName, 'id'>[]) => {
    const newItems = items.map((item, index) => ({
      ...item,
      id: `cls-imp-${Date.now()}-${index}`
    }));
    setClassNames(prev => [...prev, ...newItems]);
    bulkSyncData('classes', newItems);
  };

  // Schedule Sync Wrappers
  const syncAddSchedule = (item: ScheduleItem) => {
    setSchedule(prev => [...prev, item]);
    syncData('add', 'schedule', item);
  };

  const syncDeleteSchedule = (id: string) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
    syncData('delete', 'schedule', { id });
  };
  
  const handleImportSchedule = (items: ScheduleItem[]) => {
    // Items already have IDs from ScheduleView logic
    setSchedule(prev => [...prev, ...items]);
    bulkSyncData('schedule', items);
  };

  const handleUpdateScheduleLecturer = (scheduleId: string, lecturerId: string) => {
    const item = schedule.find(s => s.id === scheduleId);
    if (item) {
       const updatedItem = { ...item, lecturerId };
       setSchedule(prev => prev.map(s => s.id === scheduleId ? updatedItem : s));
       syncData('add', 'schedule', updatedItem); 
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col h-full items-center justify-center text-slate-500 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="font-medium text-lg">Menghubungkan ke Database Realtime...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Ringkasan Sistem</h2>
                <p className="text-slate-500">Ketersediaan data saat ini.</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button onClick={() => fetchFromSheets(sheetUrl)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-all flex items-center gap-2">
                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                    <span className="text-xs font-bold">Refresh Data</span>
                  </button>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 ${apiConnected ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <Database size={12} />
                    {apiConnected ? 'Database Terhubung' : 'Gagal Sinkron (Mode Offline)'}
                  </div>
                </div>
                {errorSync && (
                  <div className="max-w-[400px] text-[10px] text-red-500 font-medium flex items-start gap-1 text-right">
                    <AlertCircle size={10} className="shrink-0 mt-0.5" /> <span>{errorSync}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Mata Kuliah" value={courses.length} icon={BookOpen} color="text-blue-500" />
              <StatCard title="Dosen" value={lecturers.length} icon={Users} color="text-emerald-500" />
              <StatCard title="Ruangan" value={rooms.length} icon={Building2} color="text-orange-500" />
              <StatCard title="Jadwal" value={schedule.length} icon={Calendar} color="text-purple-500" />
            </div>
          </div>
        );
      case 'settings':
        return <SettingsView sheetUrl={sheetUrl} onSaveUrl={handleSaveSheetUrl} />;
      case 'monitoring':
        return <MonitoringView rooms={rooms} courses={courses} lecturers={lecturers} schedule={schedule} />;
      case 'courses':
        return <DataManager<Course> 
          title="Mata Kuliah" 
          data={courses} 
          columns={[{key: 'code', label: 'Kode MK'}, {key: 'name', label: 'Nama MK'}, {key: 'credits', label: 'SKS'}]} 
          onAdd={handleAddCourse} 
          onDelete={handleDeleteCourse}
          onImport={handleImportCourses}
        />;
      case 'lecturers':
        return <DataManager<Lecturer> 
          title="Dosen" 
          data={lecturers} 
          columns={[
            {key: 'name', label: 'Nama'}, 
            {key: 'nip', label: 'NIP'}, 
            {
              key: 'position', 
              label: 'Status', 
              type: 'select', 
              options: [
                'Asisten Ahli',
                'Lektor',
                'Lektor Kepala',
                'Guru Besar',
                'LB',
                'Praktisi'
              ]
            }
          ]} 
          onAdd={handleAddLecturer} 
          onDelete={handleDeleteLecturer}
          onImport={handleImportLecturers}
        />;
      case 'rooms':
        return <DataManager<Room>
          title="Ruangan" 
          data={rooms} 
          columns={[
            {key: 'building', label: 'Gedung'},
            {key: 'name', label: 'Ruangan'}, 
            {key: 'capacity', label: 'Kapasitas'},
            {key: 'location', label: 'Lokasi'}
          ]} 
          onAdd={handleAddRoom} 
          onDelete={handleDeleteRoom}
          onImport={handleImportRooms}
        />;
      case 'classes':
        return <DataManager<ClassName> 
          title="Kelas (PDB)" 
          data={classNames} 
          columns={[{key: 'name', label: 'Nama Kelas'}]} 
          onAdd={handleAddClass} 
          onDelete={handleDeleteClass}
          onImport={handleImportClasses}
        />;
      case 'schedule':
        return <ScheduleView 
          courses={courses} 
          lecturers={lecturers} 
          rooms={rooms} 
          classNames={classNames} 
          schedule={schedule} 
          setSchedule={setSchedule} 
          onAddSchedule={syncAddSchedule} 
          onDeleteSchedule={syncDeleteSchedule}
          onImportSchedule={handleImportSchedule}
        />;
      case 'portal':
        return <LecturerPortal 
          currentLecturerId={currentUser?.role === 'lecturer' ? currentUser.id : undefined} 
          courses={courses} 
          lecturers={lecturers} 
          rooms={rooms} 
          schedule={schedule} 
          setSchedule={setSchedule} 
          onUpdateLecturer={handleUpdateScheduleLecturer} 
        />;
      default: return <div>Not Found</div>;
    }
  };

  if (!currentUser) return <LoginView lecturers={lecturers} onLogin={handleLogin} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} userRole={currentUser.role} onChangeView={setCurrentView} isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {isSyncing && <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 z-50 overflow-hidden"><div className="h-full bg-blue-600 animate-progress"></div></div>}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><CalendarClock size={20} className="text-white" /></div>
            SIMPDB
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </main>
      <style>{`.animate-progress { width: 40%; animation: slide 1.5s infinite linear; } @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }`}</style>
    </div>
  );
};

export default App;

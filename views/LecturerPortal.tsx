import React, { useState, useEffect } from 'react';
import { User, BookOpen, Clock, Building2, Calendar, CheckCircle, AlertTriangle, X, Filter, Layers, ChevronLeft, ArrowRight } from 'lucide-react';
import { Course, Lecturer, Room, ScheduleItem } from '../types';

interface LecturerPortalProps {
  currentLecturerId?: string;
  courses: Course[];
  lecturers: Lecturer[];
  rooms: Room[];
  schedule: ScheduleItem[];
  setSchedule: (schedule: ScheduleItem[]) => void;
  onUpdateLecturer?: (scheduleId: string, lecturerId: string) => void;
}

const LecturerPortal: React.FC<LecturerPortalProps> = ({
  currentLecturerId,
  courses,
  lecturers,
  rooms,
  schedule,
  setSchedule,
  onUpdateLecturer
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>(currentLecturerId || '');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'claim' | 'release';
    item: ScheduleItem | null;
  }>({
    isOpen: false,
    type: 'claim',
    item: null
  });

  useEffect(() => {
    if (currentLecturerId) {
      setSelectedLecturerId(currentLecturerId);
    }
  }, [currentLecturerId]);

  const currentLecturerName = lecturers.find(l => l.id === selectedLecturerId)?.name || 'Dosen';
  const getCourse = (id: string) => courses.find(c => c.id === id);
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  const initiateClaim = (item: ScheduleItem) => {
    const conflict = schedule.find(s => 
      s.day === item.day && 
      s.timeSlot === item.timeSlot && 
      s.lecturerId === selectedLecturerId
    );

    if (conflict) {
      alert(`Gagal! Anda sudah memiliki jadwal mengajar pada ${conflict.day} jam ${conflict.timeSlot} di ruangan lain.`);
      return;
    }
    setConfirmModal({ isOpen: true, type: 'claim', item: item });
  };

  const initiateRelease = (item: ScheduleItem) => {
    setConfirmModal({ isOpen: true, type: 'release', item: item });
  };

  const handleConfirmAction = () => {
    const { type, item } = confirmModal;
    if (!item) return;

    if (type === 'claim') {
      if (onUpdateLecturer) {
        onUpdateLecturer(item.id, selectedLecturerId);
      } else {
        const updatedSchedule = schedule.map(s => s.id === item.id ? { ...s, lecturerId: selectedLecturerId } : s);
        setSchedule(updatedSchedule);
      }
      // Reset after claiming if needed, or stay on page
      setConfirmModal({ isOpen: false, type: 'claim', item: null });
    } else {
      if (onUpdateLecturer) {
        onUpdateLecturer(item.id, "");
      } else {
        const updatedSchedule = schedule.map(s => s.id === item.id ? { ...s, lecturerId: '' } : s);
        setSchedule(updatedSchedule);
      }
      setConfirmModal({ isOpen: false, type: 'release', item: null });
    }
  };

  // Group schedules by course for selection
  const schedulesWithoutLecturer = schedule.filter(s => !s.lecturerId);
  
  // Courses that actually have open slots
  const coursesWithOpenSlots = courses.filter(course => 
    schedulesWithoutLecturer.some(s => s.courseId === course.id)
  );

  const availableSessionsForSelectedCourse = schedulesWithoutLecturer.filter(s => s.courseId === selectedCourseId);

  const mySchedules = schedule.filter(s => s.lecturerId === selectedLecturerId);

  return (
    <div className="space-y-6 relative pb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 shadow-sm"><User size={28} /></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Portal Dosen</h2>
            <p className="text-slate-500">Selamat datang, <span className="font-semibold text-blue-600">{currentLecturerName}</span></p>
          </div>
        </div>
      </div>

      {!currentLecturerId && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4 animate-fade-in shadow-sm">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-700"><AlertTriangle size={20} /></div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Simulasi Mode Admin</p>
            <p className="text-[11px] text-amber-700">Pilih identitas dosen untuk mencoba fitur klaim jadwal.</p>
          </div>
          <select value={selectedLecturerId} onChange={(e) => {setSelectedLecturerId(e.target.value); setSelectedCourseId(null);}} className="px-3 py-2 bg-white border border-amber-300 rounded-lg focus:outline-none text-sm font-medium">
            <option value="">-- Pilih Dosen --</option>
            {lecturers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {!selectedLecturerId ? (
         <div className="bg-white rounded-2xl p-20 text-center shadow-sm border border-slate-200">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
             <User size={40} />
           </div>
           <h3 className="text-xl font-bold text-slate-700">Identitas Belum Dipilih</h3>
           <p className="text-slate-400 max-w-xs mx-auto mt-2">Silakan pilih nama dosen pada panel di atas untuk mengakses jadwal kuliah.</p>
         </div>
      ) : (
        <>
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
                <button 
                  onClick={() => setActiveTab('available')} 
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'available' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <BookOpen size={18} /> Jadwal Tersedia
                </button>
                <button 
                  onClick={() => setActiveTab('mine')} 
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'mine' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <CheckCircle size={18} /> Jadwal Saya
                  {mySchedules.length > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'mine' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>{mySchedules.length}</span>}
                </button>
            </div>

            <div className="min-h-[500px] animate-fade-in">
                {activeTab === 'available' && (
                    <div className="space-y-6">
                        {!selectedCourseId ? (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800">Pilih Mata Kuliah</h3>
                                    <p className="text-slate-500 text-sm">Klik pada salah satu mata kuliah untuk melihat jadwal kelas (PDB) yang tersedia.</p>
                                </div>
                                
                                {coursesWithOpenSlots.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                                        <Layers size={40} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-medium text-lg">Semua jadwal sudah terisi.</p>
                                        <p className="text-sm">Belum ada kelas PDB baru yang dibuka oleh Admin.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {coursesWithOpenSlots.map(course => {
                                            const openCount = schedulesWithoutLecturer.filter(s => s.courseId === course.id).length;
                                            return (
                                                <div 
                                                  key={course.id} 
                                                  onClick={() => setSelectedCourseId(course.id)}
                                                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 transition-all cursor-pointer group relative overflow-hidden"
                                                >
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <BookOpen size={80} />
                                                    </div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Layers size={20} /></div>
                                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">{openCount} Kelas Tersedia</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 text-lg mb-1 leading-tight group-hover:text-blue-600 transition-colors">{course.name}</h4>
                                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{course.code} • {course.credits} SKS</p>
                                                    <div className="mt-6 flex items-center text-blue-600 font-bold text-xs gap-2">
                                                        Lihat Jadwal <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <button 
                                      onClick={() => setSelectedCourseId(null)}
                                      className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{getCourse(selectedCourseId)?.name}</h3>
                                        <p className="text-slate-500 text-sm">Daftar kelas PDB yang dapat Anda klaim untuk mata kuliah ini.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {availableSessionsForSelectedCourse.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all flex justify-between items-center group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-tight shadow-sm">{item.className}</span>
                                                    <span className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">Ruangan: {getRoomName(item.roomId)}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                                    <div className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-500"/> <span className="font-semibold">{item.day}</span></div>
                                                    <div className="flex items-center gap-1.5"><Clock size={16} className="text-blue-500"/> <span className="font-semibold">{item.timeSlot}</span></div>
                                                </div>
                                            </div>
                                            <button 
                                              onClick={() => initiateClaim(item)} 
                                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                                            >
                                              Ambil Kelas
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'mine' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800">Jadwal Mengajar Anda</h3>
                            <p className="text-slate-500 text-sm">Berikut adalah daftar kelas PDB yang telah Anda ambil.</p>
                        </div>
                        
                        {mySchedules.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                                <CheckCircle size={40} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium text-lg">Belum ada jadwal.</p>
                                <p className="text-sm">Silakan pilih kelas pada tab "Jadwal Tersedia".</p>
                            </div>
                        ) : (
                             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Kelas</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Mata Kuliah</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Waktu</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ruangan</th>
                                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {mySchedules.map(item => {
                                                const course = getCourse(item.courseId);
                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded font-black text-xs uppercase">{item.className}</span></td>
                                                        <td className="p-4"><div className="font-bold text-slate-800 text-sm">{course?.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase">{course?.code}</div></td>
                                                        <td className="p-4 text-slate-700 text-xs font-semibold leading-relaxed">{item.day}<br/>{item.timeSlot}</td>
                                                        <td className="p-4 text-slate-700 text-sm font-medium">{getRoomName(item.roomId)}</td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => initiateRelease(item)} className="text-red-500 hover:text-white hover:bg-red-500 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-200">Lepas</button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
      )}

      {confirmModal.isOpen && confirmModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-zoom-in">
            <div className={`p-8 flex items-center gap-5 border-b ${confirmModal.type === 'claim' ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`p-4 rounded-2xl ${confirmModal.type === 'claim' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white shadow-lg shadow-red-100'}`}>
                {confirmModal.type === 'claim' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {confirmModal.type === 'claim' ? 'Konfirmasi Ambil' : 'Konfirmasi Lepas'}
                </h3>
                <p className="text-slate-500 text-xs font-medium">Kelas {confirmModal.item.className}</p>
              </div>
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-8">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="font-black text-slate-800 text-xl mb-4 leading-tight">{getCourse(confirmModal.item.courseId)?.name}</div>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-bold"><Calendar size={18} className="text-blue-500" /> <span>{confirmModal.item.day}</span></div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-bold"><Clock size={18} className="text-blue-500" /> <span>{confirmModal.item.timeSlot}</span></div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-bold"><Building2 size={18} className="text-blue-500" /> <span>{getRoomName(confirmModal.item.roomId)}</span></div>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-slate-400 font-medium">
                {confirmModal.type === 'claim' ? 'Setelah diambil, jadwal ini akan muncul di tab Jadwal Saya.' : 'Jadwal ini akan kembali tersedia untuk diambil dosen lain.'}
              </p>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 px-4 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">Batal</button>
              <button 
                onClick={handleConfirmAction} 
                className={`flex-1 px-4 py-3 rounded-2xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${confirmModal.type === 'claim' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
              >
                {confirmModal.type === 'claim' ? 'Ya, Ambil' : 'Ya, Lepas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerPortal;
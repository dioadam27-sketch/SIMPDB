import React, { useState } from 'react';
import { Building2, Clock, Calendar, CheckCircle, Info, Filter, Search, FileDown, X, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { Course, Room, ScheduleItem, DayOfWeek, TIME_SLOTS, Lecturer } from '../types';
import * as XLSX from 'xlsx';

interface MonitoringViewProps {
  rooms: Room[];
  courses: Course[];
  lecturers: Lecturer[];
  schedule: ScheduleItem[];
}

const MonitoringView: React.FC<MonitoringViewProps> = ({ rooms, courses, lecturers, schedule }) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.SENIN);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'pdf' | 'excel' | null;
  }>({
    isOpen: false,
    type: null
  });

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCourse = (id: string) => courses.find(c => c.id === id);
  const getLecturer = (id: string) => lecturers.find(l => l.id === id);

  const daySchedule = schedule.filter(s => s.day === selectedDay);

  // Stats calculation
  const totalSlots = filteredRooms.length * TIME_SLOTS.length;
  const occupiedSlots = daySchedule.filter(s => filteredRooms.some(r => r.id === s.roomId)).length;
  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  const triggerExportPDF = () => {
    setConfirmModal({ isOpen: false, type: null });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const triggerExportExcel = () => {
    if (filteredRooms.length === 0) return;

    const excelData: any[] = [];

    filteredRooms.forEach(room => {
      TIME_SLOTS.forEach(time => {
        const item = daySchedule.find(s => s.roomId === room.id && s.timeSlot === time);
        const course = item ? getCourse(item.courseId) : null;
        const lecturer = item ? getLecturer(item.lecturerId) : null;

        excelData.push({
          "Ruangan": room.name,
          "Kapasitas": room.capacity,
          "Jam Sesi": time,
          "Status": item ? "Terisi" : "Kosong",
          "Mata Kuliah": course?.name || "-",
          "Kelas": item ? item.className : "-",
          "Dosen": lecturer?.name || (item ? "Open Slot" : "-")
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Okupansi_${selectedDay}`);
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Monitoring_Okupansi_${selectedDay}_${timestamp}.xlsx`);

    setConfirmModal({ isOpen: false, type: null });
  };

  const handleConfirm = () => {
    if (confirmModal.type === 'pdf') triggerExportPDF();
    if (confirmModal.type === 'excel') triggerExportExcel();
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Monitoring Okupansi</h2>
          <p className="text-slate-500">Pantau penggunaan {rooms.length} ruangan secara real-time.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm no-print">
            {Object.values(DayOfWeek).map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === day 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="flex gap-2 no-print">
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'excel' })}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-emerald-200 shadow-sm active:scale-95"
            >
              <FileSpreadsheet size={18} />
              Excel
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'pdf' })}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-200 active:scale-95 border border-slate-700"
            >
              <FileDown size={18} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={24} /></div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Okupansi {selectedDay}</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{occupancyRate}%</span>
              <span className="text-slate-400 text-xs mb-1">{occupiedSlots} / {totalSlots} Slot Terisi</span>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari nama ruangan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm"></div> Terisi</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div> Kosong</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 print:static">
              <tr>
                <th className="bg-slate-900 text-white p-4 border-b border-slate-800 text-left w-48 sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.1)] print:static print:shadow-none">
                  Ruangan
                </th>
                {TIME_SLOTS.map(time => (
                  <th key={time} className="bg-slate-800 text-slate-200 p-3 border-b border-slate-700 text-xs font-bold uppercase min-w-[160px]">
                    <div className="flex items-center justify-center gap-2">
                      <Clock size={14} />
                      {time}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr><td colSpan={TIME_SLOTS.length + 1} className="p-12 text-center text-slate-400">Ruangan tidak ditemukan.</td></tr>
              ) : (
                filteredRooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="bg-white group-hover:bg-slate-50 p-4 border-b border-r border-slate-100 font-bold text-slate-700 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] print:static print:shadow-none">
                      <div className="flex flex-col">
                        <span>{room.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal print:hidden">Kapasitas: {room.capacity}</span>
                      </div>
                    </td>
                    {TIME_SLOTS.map(time => {
                      const item = daySchedule.find(s => s.roomId === room.id && s.timeSlot === time);
                      
                      if (item) {
                        const course = getCourse(item.courseId);
                        const lecturer = getLecturer(item.lecturerId);
                        
                        return (
                          <td key={`${room.id}-${time}`} className="p-2 border-b border-slate-100 bg-blue-50/50">
                            <div className="bg-white p-2 rounded border border-blue-200 shadow-sm print:shadow-none">
                              <div className="flex items-center justify-between mb-1">
                                <span className="bg-blue-600 text-white px-1 py-0.5 rounded text-[9px] font-black uppercase tracking-tight shadow-sm">
                                  {item.className}
                                </span>
                                <Info size={12} className="text-blue-400 print:hidden" />
                              </div>
                              <div className="text-[11px] font-bold text-slate-800 line-clamp-1" title={course?.name}>
                                {course?.name}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1 truncate">
                                {lecturer ? lecturer.name : 'Open Slot'}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={`${room.id}-${time}`} className="p-2 border-b border-slate-100">
                          <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                            <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                              <CheckCircle size={10} /> TERSEDIA
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="hidden print:block text-center text-[10px] text-slate-400 mt-4">
        Dicetak dari SIMPDB pada {new Date().toLocaleString('id-ID')} • Laporan Jadwal Hari {selectedDay}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmModal({ isOpen: false, type: null })}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-zoom-in">
            <div className={`p-6 text-center border-b border-slate-100 ${confirmModal.type === 'excel' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'excel' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                {confirmModal.type === 'excel' ? <FileSpreadsheet size={32} /> : <FileDown size={32} />}
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Konfirmasi Export {confirmModal.type?.toUpperCase()}
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                Apakah Anda yakin ingin mengunduh laporan okupansi hari <span className="font-bold text-slate-800">{selectedDay}</span>?
              </p>
            </div>
            <div className="p-4 flex gap-3">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors border border-slate-200"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-95 ${confirmModal.type === 'excel' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}
              >
                Ya, Unduh
              </button>
            </div>
            <button 
              onClick={() => setConfirmModal({ isOpen: false, type: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringView;
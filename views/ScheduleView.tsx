import React, { useState, useRef } from 'react';
import { Calendar, Trash2, Plus, AlertCircle, Check, Search, UserMinus, X, Building2, Clock, Layers, CalendarPlus, FileSpreadsheet, Upload } from 'lucide-react';
import { Course, Lecturer, Room, ScheduleItem, DayOfWeek, TIME_SLOTS, ClassName } from '../types';
import * as XLSX from 'xlsx';

interface ScheduleViewProps {
  courses: Course[];
  lecturers: Lecturer[];
  rooms: Room[];
  classNames: ClassName[];
  schedule: ScheduleItem[];
  setSchedule: (schedule: ScheduleItem[]) => void;
  onAddSchedule?: (item: ScheduleItem) => void;
  onDeleteSchedule?: (id: string) => void;
  onImportSchedule?: (items: ScheduleItem[]) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({
  courses, lecturers, rooms, classNames, schedule, setSchedule, onAddSchedule, onDeleteSchedule, onImportSchedule
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedClassName, setSelectedClassName] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | ''>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemId: string | null;
  }>({
    isOpen: false,
    itemId: null
  });

  const getCourse = (id: string) => courses.find(c => c.id === id);
  const getCourseName = (id: string) => getCourse(id)?.name || id;
  const getLecturerName = (id: string) => lecturers.find(l => l.id === id)?.name || id;
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  const getScheduleForCell = (day: DayOfWeek, time: string) => {
    const itemsInCell = schedule.filter(s => s.day === day && s.timeSlot === time);

    if (selectedRoomId) {
      const roomItem = itemsInCell.find(s => s.roomId === selectedRoomId);
      
      let lecturerBusyItem = undefined;
      if (selectedLecturerId) {
        lecturerBusyItem = schedule.find(s => 
          s.day === day && 
          s.timeSlot === time && 
          s.lecturerId === selectedLecturerId && 
          s.roomId !== selectedRoomId
        );
      }

      let classBusyItem = undefined;
      if (selectedClassName) {
        classBusyItem = itemsInCell.find(s => s.className === selectedClassName && s.roomId !== selectedRoomId);
      }

      return { items: itemsInCell, roomItem, lecturerBusyItem, classBusyItem };
    }

    return { items: itemsInCell, roomItem: undefined, lecturerBusyItem: undefined, classBusyItem: undefined };
  };

  const validateAndAdd = (day: DayOfWeek, time: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedRoomId) {
      setErrorMsg("Pilih Ruangan terlebih dahulu.");
      return;
    }
    if (!selectedCourseId) {
      setErrorMsg("Mohon pilih Mata Kuliah.");
      return;
    }
    if (!selectedClassName) {
      setErrorMsg("Mohon pilih Nama Kelas (PDB).");
      return;
    }

    const { roomItem, lecturerBusyItem, classBusyItem } = getScheduleForCell(day, time);

    if (roomItem) {
      setErrorMsg(`Ruangan ${getRoomName(selectedRoomId)} sudah terisi pada ${day} jam ${time}.`);
      return;
    }
    if (classBusyItem) {
      setErrorMsg(`Kelas ${selectedClassName} sudah memiliki jadwal di ruangan ${getRoomName(classBusyItem.roomId)} pada jam ini.`);
      return;
    }
    if (lecturerBusyItem) {
      const busyRoom = getRoomName(lecturerBusyItem.roomId);
      setErrorMsg(`Dosen ini sedang mengajar di ${busyRoom} pada jam tersebut.`);
      return;
    }

    const newItem: ScheduleItem = {
      id: `sch-${Date.now()}`,
      courseId: selectedCourseId,
      lecturerId: selectedLecturerId, 
      roomId: selectedRoomId,
      className: selectedClassName,
      day,
      timeSlot: time
    };

    if (onAddSchedule) {
        onAddSchedule(newItem);
    } else {
        setSchedule([...schedule, newItem]);
    }

    setSuccessMsg(`Berhasil menambahkan jadwal ${selectedClassName} - ${getCourseName(selectedCourseId)}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleManualAdd = () => {
    if (!selectedDay || !selectedTime) {
      setErrorMsg("Mohon pilih Hari dan Jam Sesi.");
      return;
    }
    validateAndAdd(selectedDay as DayOfWeek, selectedTime);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, itemId: id });
  };

  const confirmDelete = () => {
    if (deleteModal.itemId) {
        if (onDeleteSchedule) {
            onDeleteSchedule(deleteModal.itemId);
        } else {
            setSchedule(schedule.filter(s => s.id !== deleteModal.itemId));
        }
    }
    setDeleteModal({ isOpen: false, itemId: null });
  };

  const exportScheduleExcel = () => {
    if (schedule.length === 0) return;

    const excelData = schedule.map(s => {
      const course = getCourse(s.courseId);
      const lecturer = lecturers.find(l => l.id === s.lecturerId);
      const room = rooms.find(r => r.id === s.roomId);
      
      return {
        "Hari": s.day,
        "Waktu": s.timeSlot,
        "Nama Kelas": s.className,
        "Mata Kuliah": course?.name || s.courseId,
        "Kode MK": course?.code || '-',
        "Dosen": lecturer?.name || 'Open Slot',
        "Ruangan": room?.name || s.roomId
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jadwal Kuliah");
    
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Jadwal_Kuliah_Lengkap_${timestamp}.xlsx`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          setErrorMsg("File Excel kosong.");
          return;
        }

        const newItems: ScheduleItem[] = [];
        let skipped = 0;

        jsonData.forEach((row: any) => {
          // Normalize Keys (Handle Case Insensitive & Variations)
          const day = row['Hari'] || row['Day'];
          const time = row['Waktu'] || row['Jam Sesi'] || row['Time'];
          const className = row['Nama Kelas'] || row['Kelas'] || row['Class'];
          const courseName = row['Mata Kuliah'] || row['Course'];
          const lecturerName = row['Dosen'] || row['Lecturer'];
          const roomName = row['Ruangan'] || row['Room'];

          // Lookup IDs based on Names
          const course = courses.find(c => c.name.toLowerCase() === String(courseName).toLowerCase() || c.code === String(courseName));
          const room = rooms.find(r => r.name.toLowerCase() === String(roomName).toLowerCase());
          
          // Allow lecturer to be optional or 'Open Slot'
          let lecturerId = '';
          if (lecturerName && String(lecturerName).toLowerCase() !== 'open slot') {
             const lecturer = lecturers.find(l => l.name.toLowerCase() === String(lecturerName).toLowerCase());
             if (lecturer) lecturerId = lecturer.id;
          }

          if (day && time && className && course && room) {
             newItems.push({
               id: `sch-imp-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
               day: day as DayOfWeek,
               timeSlot: time,
               className: String(className),
               courseId: course.id,
               lecturerId: lecturerId,
               roomId: room.id
             });
          } else {
             skipped++;
          }
        });

        if (onImportSchedule && newItems.length > 0) {
           onImportSchedule(newItems);
           setSuccessMsg(`Berhasil mengimpor ${newItems.length} jadwal. ${skipped > 0 ? `${skipped} baris dilewati karena data tidak lengkap/cocok.` : ''}`);
        } else {
           setErrorMsg(`Gagal mengimpor. ${skipped} baris dilewati. Pastikan nama Mata Kuliah dan Ruangan sesuai dengan data master.`);
        }

      } catch (error) {
        console.error("Import Error:", error);
        setErrorMsg("Gagal membaca file Excel.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const itemToDelete = deleteModal.itemId ? schedule.find(s => s.id === deleteModal.itemId) : null;

  return (
    <div className="space-y-6 relative animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-800">Penjadwalan Kuliah</h2>
          <p className="text-slate-500 text-sm">Gunakan dropdown di bawah atau klik langsung pada tabel untuk mengisi jadwal.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {onImportSchedule && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-indigo-200 shadow-sm"
              >
                <Upload size={18} /> Import Excel
              </button>
            </>
          )}
          <button 
            onClick={exportScheduleExcel}
            disabled={schedule.length === 0}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-emerald-200 shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            Export Jadwal
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Baris 1: Data Kuliah */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Layers size={14} className="text-blue-500" /> Mata Kuliah
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Pilih Mata Kuliah --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.credits} SKS)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Search size={14} className="text-blue-500" /> Nama Kelas (PDB)
              </label>
              <select
                value={selectedClassName}
                onChange={(e) => setSelectedClassName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Pilih Kelas --</option>
                {classNames.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 2: Lokasi & Personil */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <Building2 size={14} className="text-blue-500" /> Ruangan
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className={`w-full p-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${selectedRoomId ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200'}`}
              >
                <option value="">-- Pilih Ruangan --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (Kap: {r.capacity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <UserMinus size={14} className="text-blue-500" /> Dosen (Opsional)
              </label>
              <select
                value={selectedLecturerId}
                onChange={(e) => setSelectedLecturerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">-- Open Slot (Tanpa Dosen) --</option>
                {lecturers.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 3: Waktu & Aksi */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hari</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Hari</option>
                    {Object.values(DayOfWeek).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jam Sesi</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Jam</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
             </div>
             <button 
                onClick={handleManualAdd}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <CalendarPlus size={18} /> Tambah ke Jadwal
              </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <Check size={20} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-900 text-white p-4 border-b border-slate-800 w-24 text-[10px] font-bold uppercase sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Sesi</th>
                {Object.values(DayOfWeek).map(day => (
                  <th key={day} className={`bg-slate-800 text-slate-200 p-4 border-b border-slate-700 min-w-[220px] text-[10px] font-black tracking-widest uppercase text-center transition-colors ${selectedDay === day ? 'text-blue-400 bg-slate-900' : ''}`}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TIME_SLOTS.map(time => (
                <tr key={time} className={selectedTime === time ? 'bg-blue-50/20' : ''}>
                  <td className={`bg-white p-4 border-r border-slate-100 text-[11px] font-black sticky left-0 z-10 text-center transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${selectedTime === time ? 'text-blue-600' : 'text-slate-400'}`}>{time}</td>
                  {Object.values(DayOfWeek).map(day => {
                    const { items, roomItem, lecturerBusyItem, classBusyItem } = getScheduleForCell(day, time);
                    
                    let cellContent = null;
                    let cellClass = "p-3 border-r border-slate-50 align-top h-40 relative transition-all duration-200 ";
                    const isTarget = selectedDay === day && selectedTime === time;
                    const isClickable = selectedRoomId && !roomItem && !lecturerBusyItem && !classBusyItem;

                    if (isClickable) {
                        cellClass += "cursor-pointer hover:bg-blue-50/50 group ";
                    } else if (!selectedRoomId) {
                        cellClass += "bg-slate-50/30 ";
                    }

                    if (isTarget) {
                        cellClass += "ring-2 ring-inset ring-blue-400 bg-blue-50/30 ";
                    }

                    if (selectedRoomId) {
                        if (roomItem) {
                            const hasLecturer = !!roomItem.lecturerId;
                            cellClass += hasLecturer ? "bg-blue-50/80" : "bg-amber-50/80";
                            cellContent = (
                                <div className="h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200 text-[10px] font-black text-slate-700 uppercase">{roomItem.className}</span>
                                        </div>
                                        <div className={`font-bold text-[11px] leading-snug line-clamp-2 ${hasLecturer ? 'text-blue-900' : 'text-amber-900'}`}>
                                            {getCourseName(roomItem.courseId)}
                                        </div>
                                        <div className={`text-[10px] mt-2 flex items-center gap-1.5 font-medium ${hasLecturer ? 'text-blue-700' : 'text-amber-700 italic opacity-70'}`}>
                                            {hasLecturer ? <><Check size={10} className="text-blue-500"/> {getLecturerName(roomItem.lecturerId)}</> : <><UserMinus size={10}/> Open Slot</>}
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleDeleteClick(roomItem.id, e)} className="self-end text-slate-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"><Trash2 size={16} /></button>
                                </div>
                            );
                        } else if (classBusyItem) {
                            cellClass += "bg-red-50/50 border-l-4 border-red-300";
                            cellContent = <div className="flex flex-col h-full justify-center items-center text-red-500 text-[10px] text-center font-bold gap-1"><AlertCircle size={16} /><span>Kelas {selectedClassName}<br/>di {getRoomName(classBusyItem.roomId)}</span></div>;
                        } else if (lecturerBusyItem) {
                             cellClass += "bg-orange-50/50 border-l-4 border-orange-300";
                             cellContent = <div className="flex flex-col h-full justify-center items-center text-orange-500 text-[10px] text-center font-bold gap-1"><AlertCircle size={16} /><span>Dosen Mengajar<br/>di {getRoomName(lecturerBusyItem.roomId)}</span></div>;
                        } else if (isClickable) {
                             cellContent = <div className={`h-full w-full items-center justify-center text-blue-400 transition-opacity ${isTarget ? 'flex' : 'hidden group-hover:flex'}`}><Plus size={32} /></div>;
                        }
                    } else {
                        if (items.length > 0) {
                            cellContent = (
                                <div className="flex flex-col gap-2 overflow-y-auto max-h-32 pr-1 custom-scrollbar">
                                    {items.map(item => (
                                        <div key={item.id} className={`border p-2 rounded-xl shadow-sm text-[10px] group transition-all hover:shadow-md ${item.lecturerId ? 'bg-white border-slate-100' : 'bg-amber-50 border-amber-100'}`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-black text-blue-600 tracking-tighter">{item.className}</span>
                                                <button onClick={(e) => handleDeleteClick(item.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                            </div>
                                            <div className="font-bold truncate text-slate-800 mb-0.5">{getCourseName(item.courseId)}</div>
                                            <div className="text-slate-400 font-medium flex items-center gap-1"><Building2 size={10}/> {getRoomName(item.roomId)}</div>
                                            {!item.lecturerId && <div className="text-amber-600 italic text-[9px] mt-1 flex items-center gap-1"><UserMinus size={9}/> Open Slot</div>}
                                        </div>
                                    ))}
                                </div>
                            );
                        }
                    }

                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className={cellClass} 
                        onClick={() => isClickable && validateAndAdd(day, time)}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteModal.isOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}></div>
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-zoom-in">
              <div className="bg-red-50 p-6 flex items-center justify-between border-b border-red-100">
                 <h3 className="text-lg font-bold text-slate-800">Hapus Jadwal?</h3>
                 <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8">
                <p className="text-slate-600 mb-6 text-sm">Hapus jadwal <strong>{getCourseName(itemToDelete.courseId)}</strong> untuk kelas <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-800">{itemToDelete.className}</span>?</p>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-3 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-3"><Calendar size={16} className="text-blue-500"/> {itemToDelete.day}</div>
                      <div className="flex items-center gap-3"><Clock size={16} className="text-blue-500"/> {itemToDelete.timeSlot}</div>
                      <div className="flex items-center gap-3"><Building2 size={16} className="text-blue-500"/> {getRoomName(itemToDelete.roomId)}</div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-4 border-t border-slate-100">
                 <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 px-4 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-200 text-sm transition-all">Batal</button>
                 <button onClick={confirmDelete} className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-100 transition-all transform active:scale-95">Ya, Hapus</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
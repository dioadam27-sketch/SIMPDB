import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Download, FileSpreadsheet, Upload, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataManagerProps<T> {
  title: string;
  data: T[];
  columns: { 
    key: keyof T; 
    label: string;
    type?: 'text' | 'number' | 'select';
    options?: string[];
  }[];
  onAdd: (item: Omit<T, 'id'>) => void;
  onDelete: (id: string) => void;
  onImport?: (items: Omit<T, 'id'>[]) => void;
}

const DataManager = <T extends { id: string }>({ title, data, columns, onAdd, onDelete, onImport }: DataManagerProps<T>) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData as any);
    setFormData({});
    setIsAdding(false);
  };

  const exportToExcel = () => {
    if (data.length === 0) return;

    // Prepare data for Excel
    const excelData = data.map(item => {
      const row: any = {};
      columns.forEach(col => {
        row[col.label] = item[col.key];
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_${title.replace(/\s+/g, '_')}_${timestamp}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        if (jsonData.length === 0) {
          setImportError("File Excel kosong.");
          return;
        }

        // Map Excel headers (Label) to Data Keys
        const mappedData: any[] = jsonData.map((row: any) => {
          const newItem: any = {};
          let isValid = true;

          columns.forEach(col => {
            // Try to find data by Label first (e.g., "Nama MK"), then by Key (e.g., "name")
            const value = row[col.label] || row[col.key as string] || row[col.label.toUpperCase()] || row[col.key.toString().toUpperCase()];
            
            if (value === undefined || value === null || String(value).trim() === '') {
               // Allow empty for optional fields logic if needed, but for now mostly strict
               // For basic usage, we accept whatever is there
            }
            newItem[col.key] = value ? String(value) : '';
          });
          return newItem;
        });

        if (onImport) {
          onImport(mappedData);
          alert(`Berhasil membaca ${mappedData.length} baris data. Proses simpan sedang berjalan...`);
        }
      } catch (error) {
        console.error("Import Error:", error);
        setImportError("Gagal membaca file Excel. Pastikan format sesuai.");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen {title}</h2>
          <p className="text-slate-500">Kelola daftar {title.toLowerCase()} universitas.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {onImport && (
            <>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-indigo-200 shadow-sm"
              >
                <Upload size={18} />
                Import Excel
              </button>
            </>
          )}
          <button
            onClick={exportToExcel}
            disabled={data.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <FileSpreadsheet size={18} />
            Export
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={18} />
            Tambah {title}
          </button>
        </div>
      </div>

      {importError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{importError}</span>
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 animate-fade-in">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" /> Form {title} Baru
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {columns.map(col => (
              <div key={col.key.toString()} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{col.label}</label>
                {col.type === 'select' && col.options ? (
                  <select
                    required
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all appearance-none"
                    value={formData[col.key as string] || ''}
                    onChange={e => handleInputChange(col.key as string, e.target.value)}
                  >
                    <option value="">-- Pilih {col.label} --</option>
                    {col.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={col.type === 'number' || (!col.type && (col.key === 'credits' || col.key === 'capacity')) ? 'number' : 'text'}
                    required
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    value={formData[col.key as string] || ''}
                    onChange={e => handleInputChange(col.key as string, e.target.value)}
                    placeholder={`Masukkan ${col.label}`}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2">
               <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th key={col.key.toString()} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <FileSpreadsheet size={40} className="opacity-20" />
                       <span className="font-medium">Belum ada data {title.toLowerCase()}.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    {columns.map(col => (
                      <td key={col.key.toString()} className="px-6 py-4 text-sm text-slate-700 font-medium">
                        {String(item[col.key])}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-slate-300 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
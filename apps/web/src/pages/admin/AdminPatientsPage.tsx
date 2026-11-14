/**
 * apps/web/src/pages/admin/AdminPatientsPage.tsx
 * Professional Clinical Admin Patient Records Management (M6).
 * Clinical Minimalism × Modern AI Workspace.
 */

import React, { useState, useEffect } from 'react';
import { HeartPulse, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, RefreshCw, Search, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminPatientsPage: React.FC = () => {
  const toast = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<{ id: number; code: string } | null>(null);

  const [newPatient, setNewPatient] = useState({
    code: '',
    birth_year: 1980,
    handedness: 'RIGHT',
    notes: '',
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.patients.list();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
      toast.error('Không thể tải danh sách bệnh nhân.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.code.trim()) {
      toast.warning('Vui lòng nhập mã bệnh nhân (ví dụ: P002).');
      return;
    }

    setSubmitting(true);
    try {
      await api.patients.create({
        code: newPatient.code.trim().toUpperCase(),
        birth_year: Number(newPatient.birth_year),
        handedness: newPatient.handedness,
        notes: newPatient.notes,
      });
      setIsModalOpen(false);
      toast.success(`Đã tạo hồ sơ bệnh nhân ${newPatient.code.toUpperCase()} thành công.`);
      setNewPatient({ code: '', birth_year: 1980, handedness: 'RIGHT', notes: '' });
      fetchPatients();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo hồ sơ bệnh nhân.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await api.patients.delete(patientToDelete.id);
      toast.success(`Đã xóa hồ sơ bệnh nhân ${patientToDelete.code}.`);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xóa hồ sơ.');
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (!search.trim()) return true;
    return (
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-clinical-border shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-clinical-text">Quản Lý Hồ Sơ Bệnh Nhân</h1>
            <p className="text-xs text-clinical-secondary">
              Hồ sơ người bệnh BCI có kiểm toán bảo mật nghiêm ngặt (Tổng số: {patients.length})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={fetchPatients}
            className="p-2 rounded-xl border border-clinical-border bg-gray-50 hover:bg-gray-100 text-clinical-secondary transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-clinical-blue hover:bg-clinical-blueHover text-white font-bold text-xs tracking-wide shadow-xs shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bệnh Nhân Mới</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-clinical-border shadow-xs flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-clinical-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã bệnh nhân hoặc ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
          />
        </div>
        <span className="text-[11px] font-mono text-clinical-secondary hidden sm:inline">
          Dữ liệu mã hóa theo chuẩn HIPAA / GDPR lâm sàng
        </span>
      </div>

      {/* Patients Table Card */}
      <div className="bg-white rounded-2xl border border-clinical-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Đang tải danh sách hồ sơ...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Chưa có bệnh nhân nào được lưu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-clinical-border text-clinical-secondary font-mono">
                  <th className="py-3.5 px-4">Mã Bệnh Nhân</th>
                  <th className="py-3.5 px-4">Năm Sinh</th>
                  <th className="py-3.5 px-4">Thuận Tay</th>
                  <th className="py-3.5 px-4">Ghi Chú Y Khoa</th>
                  <th className="py-3.5 px-4">Ngày Tạo</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-border font-mono">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-clinical-blue font-bold text-sm">{p.code}</td>
                    <td className="py-3 px-4 text-clinical-text">{p.birth_year || '—'}</td>
                    <td className="py-3 px-4 text-clinical-secondary">
                      {p.handedness === 'RIGHT' ? 'Tay phải' : p.handedness === 'LEFT' ? 'Tay trái' : p.handedness}
                    </td>
                    <td className="py-3 px-4 font-sans text-clinical-text">{p.notes || '—'}</td>
                    <td className="py-3 px-4 text-clinical-secondary text-[11px]">
                      {new Date(p.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setPatientToDelete({ id: p.id, code: p.code })}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        title="Xóa hồ sơ bệnh nhân"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-clinical-border p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-clinical-border">
              <h3 className="font-bold text-base text-clinical-text">Thêm Hồ Sơ Bệnh Nhân Mới</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-semibold text-clinical-text block">Mã Bệnh Nhân (Bắt buộc)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: P002, ALS_SUBJ_03"
                  value={newPatient.code}
                  onChange={(e) => setNewPatient({ ...newPatient, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-clinical-text block">Năm Sinh</label>
                  <input
                    type="number"
                    min="1920"
                    max="2026"
                    value={newPatient.birth_year}
                    onChange={(e) => setNewPatient({ ...newPatient, birth_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-clinical-text block">Thuận Tay</label>
                  <select
                    value={newPatient.handedness}
                    onChange={(e) => setNewPatient({ ...newPatient, handedness: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
                  >
                    <option value="RIGHT">Tay phải (Right)</option>
                    <option value="LEFT">Tay trái (Left)</option>
                    <option value="AMBIDEXTROUS">Thuận cả 2 tay</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-clinical-text block">Ghi Chú Y Khoa / Lâm Sàng</label>
                <textarea
                  rows={3}
                  placeholder="Triệu chứng, giai đoạn ALS, khả năng cử động mắt..."
                  value={newPatient.notes}
                  onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
                />
              </div>

              <div className="pt-2 border-t border-clinical-border flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-clinical-border text-xs font-semibold text-clinical-secondary hover:bg-gray-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-clinical-blue hover:bg-clinical-blueHover text-white text-xs font-bold transition-all shadow-xs"
                >
                  {submitting ? 'Đang Lưu...' : 'Tạo Hồ Sơ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirm Modal */}
      <ConfirmModal
        isOpen={!!patientToDelete}
        title="Xác Nhận Xóa Hồ Sơ Bệnh Nhân"
        message={`Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân ${patientToDelete?.code}? Mọi dữ liệu phiên thu liên quan sẽ bị ngắt kết nối.`}
        confirmLabel="Xóa Hồ Sơ"
        cancelLabel="Hủy Bỏ"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPatientToDelete(null)}
      />
    </div>
  );
};

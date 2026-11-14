/**
 * apps/web/src/pages/admin/AdminUsersPage.tsx
 * Professional Clinical Admin User Management with Role Modification & Status Toggles (M6).
 * Clinical Minimalism × Modern AI Workspace.
 */

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Shield, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { AuthUser } from '../../types';

export const AdminUsersPage: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.listUsers({
        q: search || undefined,
        role: roleFilter || undefined,
        limit: 50,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      toast.success(`Đã cập nhật vai trò người dùng thành '${newRole}'.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thay đổi vai trò.');
    }
  };

  const handleStatusToggle = async (userId: number, currentActive?: boolean) => {
    try {
      await api.admin.updateUserStatus(userId, !currentActive);
      toast.success(`Đã thay đổi trạng thái kích hoạt tài khoản.`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật trạng thái tài khoản.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-clinical-border shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-clinical-text">Quản Lý Người Dùng & Phân Quyền RBAC</h1>
            <p className="text-xs text-clinical-secondary">
              Quản trị tài khoản bác sĩ, nhà nghiên cứu và người chăm sóc lâm sàng (Tổng: {total})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-clinical-border text-xs text-clinical-text font-semibold transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-clinical-secondary" />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-clinical-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-clinical-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo username hoặc họ tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-clinical-secondary" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans w-full sm:w-auto"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="researcher">Nhà nghiên cứu (Researcher)</option>
            <option value="caregiver">Người chăm sóc (Caregiver)</option>
          </select>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-2xl border border-clinical-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Đang tải danh sách tài khoản...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Không tìm thấy người dùng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-clinical-border text-clinical-secondary font-mono">
                  <th className="py-3.5 px-4">Tài Khoản</th>
                  <th className="py-3.5 px-4">Họ Và Tên</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Vai Trò RBAC</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-border font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-clinical-text">@{u.username}</td>
                    <td className="py-3 px-4 text-clinical-text font-sans font-medium">{u.full_name}</td>
                    <td className="py-3 px-4 text-clinical-secondary">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-clinical-border bg-gray-50 text-clinical-text font-sans text-xs focus:outline-none focus:border-clinical-blue"
                      >
                        <option value="caregiver">Caregiver</option>
                        <option value="researcher">Researcher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                          u.is_active
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Khóa Tài Khoản' : 'Kích Hoạt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

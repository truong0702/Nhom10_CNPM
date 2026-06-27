import { useEffect, useState } from 'react';
import { FaBus, FaEdit, FaPlus, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import vehicleApi from '../services/vehicleApi.js';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [form, setForm] = useState({
    plateNumber: '',
    type: 'seating',
    driverName: '',
    status: 'active',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vehicleApi.list();
      setVehicles(res.vehicles || []);
      const catRes = await vehicleApi.getCategories();
      setCategories(catRes.categories || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setForm({
      plateNumber: '',
      type: 'seating',
      driverName: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      driverName: vehicle.driverName || '',
      status: vehicle.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa xe này không?')) return;
    setLoading(true);
    try {
      await vehicleApi.delete(id);
      loadData();
    } catch (err) {
      setError(err.message || 'Không thể xóa xe');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plateNumber.trim()) {
      setError('Vui lòng nhập biển số xe');
      return;
    }
    setLoading(true);
    try {
      if (editingVehicle) {
        await vehicleApi.update(editingVehicle.id, form);
      } else {
        await vehicleApi.create(form);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-red-600">Nhà xe</div>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Quản lý đội xe</h1>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-red-700"
        >
          <FaPlus /> Thêm xe mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <th className="px-6 py-4">Biển số xe</th>
              <th className="px-6 py-4">Loại xe</th>
              <th className="px-6 py-4">Tài xế phụ trách</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && vehicles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center font-bold text-slate-400">
                  Đang tải danh sách...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center font-bold text-slate-400">
                  Chưa có xe nào trong hệ thống.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-black text-slate-900 flex items-center gap-2">
                    <FaBus className="text-slate-400" />
                    {v.plateNumber}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-600">
                    {v.type === 'sleeping' ? 'Xe giường nằm' : 'Xe ghế ngồi'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-600">
                    {v.driverName || 'Chưa phân công'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        v.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {v.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                        title="Sửa thông tin xe"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                        title="Xóa xe"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-black text-slate-950 mb-4">
              {editingVehicle ? 'Sửa thông tin xe' : 'Thêm xe mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700">Biển số xe</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 29A-123.45"
                  value={form.plateNumber}
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Loại xe</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-red-500"
                >
                  <option value="seating">Xe ghế ngồi</option>
                  <option value="sleeping">Xe giường nằm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700">Tên tài xế</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-red-500"
                />
              </div>

              {editingVehicle && (
                <div>
                  <label className="block text-sm font-bold text-slate-700">Trạng thái hoạt động</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-red-500"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {editingVehicle ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

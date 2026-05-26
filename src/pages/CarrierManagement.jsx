import { useEffect, useMemo, useState } from 'react'
import adminApi from '../services/adminApi.js'

export default function CarrierManagement() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [carriers, setCarriers] = useState([])

  const [filterApproved, setFilterApproved] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })

  const load = async () => {
    try {
      const response = await adminApi.getCarriers()
      setCarriers(response.carriers || [])
    } catch (e) {
      setError(e.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    load()
  }, [])

  const filtered = useMemo(() => {
    return carriers.filter((c) => {
      if (filterApproved !== 'all') {
        const should = filterApproved === 'approved'
        if (should !== Boolean(c.approved)) return false
      }
      if (filterStatus !== 'all') {
        if (c.status !== filterStatus) return false
      }
      return true
    })
  }, [carriers, filterApproved, filterStatus])

  const startEdit = (carrier) => {
    setEditId(carrier.id)
    setForm({ name: carrier.name || '', phone: carrier.phone || '', address: carrier.address || '' })
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm({ name: '', phone: '', address: '' })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editId) return

    if (!form.name.trim()) return setError('Vui lòng nhập tên nhà xe')

    setLoading(true)
    setError('')
    try {
      await adminApi.updateCarrier(editId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
      cancelEdit()
      await load()
    } catch (err) {
      setError(err.message || 'Không thể lưu')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (id) => {
    setLoading(true)
    setError('')
    try {
      approveCarrier(id)
      setCarriers(getCarriers())
    } catch (e) {
      setError(e.message || 'Không thể duyệt')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = (id, next) => {
    setLoading(true)
    setError('')
    try {
      setCarrierStatus(id, next)
      setCarriers(getCarriers())
    } catch (e) {
      setError(e.message || 'Không thể cập nhật trạng thái')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDummy = () => {
    setLoading(true)
    setError('')
    try {
      createCarrier({
        name: 'Nhà xe mới',
        phone: '0900 000 000',
        address: '—',
        status: 'active',
        approved: false
      })
      setCarriers(getCarriers())
    } catch (e) {
      setError(e.message || 'Không thể tạo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500/10 via-white to-red-500/10 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Quản lý nhà xe</h1>
          <p className="text-gray-600 font-semibold mt-1">Duyệt nhà xe • Sửa thông tin • Điều chỉnh trạng thái</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 text-red-800 border border-red-300 px-4 py-3 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filterApproved}
                onChange={(e) => setFilterApproved(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none focus:border-red-500"
              >
                <option value="all">Duyệt: Tất cả</option>
                <option value="approved">Đã duyệt</option>
                <option value="not_approved">Chưa duyệt</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none focus:border-red-500"
              >
                <option value="all">Trạng thái: Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không còn hoạt động</option>
              </select>

              <button
                onClick={() => {
                  setFilterApproved('all')
                  setFilterStatus('all')
                }}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-semibold hover:bg-gray-50"
              >
                Reset filter
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 font-semibold hover:bg-gray-50"
              >
                Làm mới
              </button>
              <button
                onClick={handleAddDummy}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black hover:from-red-600 hover:to-red-700"
              >
                + Tạo nhà xe
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="text-gray-600 font-semibold">Đang tải...</div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="text-gray-600 text-sm font-bold">
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">Tên</th>
                        <th className="py-3 px-3">SĐT</th>
                        <th className="py-3 px-3">Địa chỉ</th>
                        <th className="py-3 px-3">Duyệt</th>
                        <th className="py-3 px-3">Trạng thái</th>
                        <th className="py-3 px-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500 font-semibold">
                            Không có dữ liệu phù hợp
                          </td>
                        </tr>
                      ) : (
                        filtered.map((c) => (
                          <tr key={c.id} className="border-t border-gray-100">
                            <td className="py-3 px-3 font-semibold text-gray-900">{c.id}</td>
                            <td className="py-3 px-3 font-semibold text-gray-900">{c.name}</td>
                            <td className="py-3 px-3 text-gray-700">{c.phone}</td>
                            <td className="py-3 px-3 text-gray-700">{c.address}</td>
                            <td className="py-3 px-3">
                              {c.approved ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-bold text-xs">Đã duyệt</span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">Chưa duyệt</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {c.status === 'active' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">Hoạt động</span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs">Không còn hoạt động</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-2">
                                {!c.approved && (
                                  <button
                                    onClick={() => handleApprove(c.id)}
                                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black text-xs hover:from-red-600 hover:to-red-700"
                                  >
                                    Duyệt
                                  </button>
                                )}

                                <button
                                  onClick={() => startEdit(c)}
                                  className="px-3 py-1.5 rounded-xl border-2 border-gray-200 font-bold text-xs hover:bg-gray-50"
                                >
                                  Sửa
                                </button>

                                {c.status === 'active' ? (
                                  <button
                                    onClick={() => handleToggleStatus(c.id, 'inactive')}
                                    className="px-3 py-1.5 rounded-xl bg-gray-900 text-white font-black text-xs hover:bg-gray-800"
                                  >
                                    Không còn hoạt động
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStatus(c.id, 'active')}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700"
                                  >
                                    Hoạt động
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {editId && (
                  <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-3xl p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                      <div>
                        <h2 className="text-xl font-black text-gray-900">Sửa thông tin nhà xe (ID: {editId})</h2>
                        <p className="text-gray-600 font-semibold">Cập nhật tên / SĐT / Địa chỉ</p>
                      </div>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700">Tên nhà xe</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700">SĐT</label>
                        <input
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700">Địa chỉ</label>
                        <input
                          value={form.address}
                          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-3 flex gap-3 items-center justify-end">
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-black hover:from-red-600 hover:to-red-700 shadow-lg"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


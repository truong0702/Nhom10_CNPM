import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordField from '../components/PasswordField'

export default function UserManagement() {
  const navigate = useNavigate()
  const { user, isAdmin, adminGetAllUsers, adminUpdateUser, adminDeleteUser, loading } = useAuth()

  const [localUsers, setLocalUsers] = useState([])
  const [error, setError] = useState('')

  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })

  const canEdit = useMemo(() => Boolean(editId), [editId])

  const load = async () => {
    try {
      const users = await adminGetAllUsers()
      setLocalUsers(users)
      setError('')
    } catch (e) {
      setError(e.message || 'Không thể tải danh sách người dùng')
    }
  }

  useEffect(() => {
    if (!loading && user && !isAdmin()) {
      navigate('/', { replace: true })
      return
    }

    if (!loading && user && isAdmin()) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  const startEdit = (u) => {
    setEditId(u.id)
    setForm({ fullName: u.fullName || '', email: u.email || '', password: '' })
    setError('')
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm({ fullName: '', email: '', password: '' })
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editId) return

    if (!form.fullName.trim()) {
      setError('Vui lòng nhập Họ tên')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Email không hợp lệ')
      return
    }

    // password optional
    try {
      setError('')
      await adminUpdateUser(editId, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password ? form.password : undefined
      })
      cancelEdit()
      load()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật tài khoản')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này không?')) return
    try {
      setError('')
      await adminDeleteUser(id)
      // nếu đang sửa chính mình, đóng form
      if (editId === id) cancelEdit()
      load()
    } catch (err) {
      setError(err.message || 'Không thể xóa tài khoản')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500/10 via-white to-red-500/10 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900">Quản lý tài khoản (Admin)</h1>
          <p className="text-gray-600 font-semibold mt-1">Sửa / Xóa người dùng</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 text-red-800 border border-red-300 px-4 py-3 rounded-xl font-semibold">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold text-gray-900">Tổng: {localUsers.length} người</p>
              </div>
              <button
                onClick={load}
                className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 font-semibold hover:bg-gray-50"
              >
                Làm mới
              </button>
            </div>
          </div>

          <div className="p-6">
            {localUsers.length === 0 ? (
              <div className="py-10 text-center text-gray-600 font-semibold">Không có dữ liệu</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-gray-600 text-sm font-bold">
                      <th className="py-3 px-3">ID</th>
                      <th className="py-3 px-3">Họ tên</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Tạo lúc</th>
                      <th className="py-3 px-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localUsers
                      .slice()
                      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                      .map((u) => {
                          const isCurrentAdmin = u.email === 'admin@vexe.local' // current admin account
                        const isEditing = editId === u.id

                        return (
                          <tr key={u.id} className="border-t border-gray-100">
                            <td className="py-3 px-3 font-semibold text-gray-900">{u.id}</td>
                            <td className="py-3 px-3 font-semibold text-gray-900">{u.fullName}</td>
                            <td className="py-3 px-3 text-gray-700">{u.email}</td>
                            <td className="py-3 px-3 text-gray-700">
                              {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-2 items-center">
                                <button
                                  onClick={() => startEdit(u)}
                                  className={
                                    'px-3 py-1.5 rounded-xl border-2 font-bold text-xs hover:bg-gray-50 ' +
                                    (isEditing ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-900')
                                  }
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  disabled={isCurrentAdmin}
                                  className={
                                    'px-3 py-1.5 rounded-xl text-white font-black text-xs hover:from-red-600 hover:to-red-700 ' +
                                    (isCurrentAdmin
                                      ? 'bg-gray-300 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-red-500 to-red-600')
                                  }
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {canEdit && (
              <div className="mt-8 bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-3xl p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Sửa tài khoản (ID: {editId})</h2>
                    <p className="text-gray-600 font-semibold">Nhập password mới nếu muốn đổi mật khẩu</p>
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
                    <label className="block text-sm font-black text-gray-700">Họ tên</label>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-700">Email</label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-gray-700">Password mới (optional)</label>
                    <PasswordField
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold"
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-gray-500">Để trống nếu không muốn đổi mật khẩu</p>
                  </div>

                  <div className="md:col-span-3 flex gap-3 items-center justify-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-5 py-2.5 rounded-xl border-2 border-gray-200 font-bold hover:bg-gray-50"
                    >
                      Hủy
                    </button>
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
        </div>

        <div className="text-xs text-gray-500 pt-4">
          * Dữ liệu được quản lý qua backend; thao tác sẽ cập nhật trên server.
        </div>
      </div>
    </div>
  )
}


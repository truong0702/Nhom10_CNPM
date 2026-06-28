import { useEffect, useMemo, useState } from 'react'
import {
  FaCheck,
  FaEdit,
  FaFilter,
  FaPlus,
  FaPowerOff,
  FaSearch,
  FaSyncAlt,
  FaTrash,
} from 'react-icons/fa'
import adminApi from '../services/adminApi.js'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  approved: false,
  status: 'inactive',
}

export default function CarrierManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [carriers, setCarriers] = useState([])
  const [query, setQuery] = useState('')
  const [filterApproved, setFilterApproved] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const loadCarriers = async () => {
    try {
      setError('')
      const response = await adminApi.getCarriers()
      setCarriers(response.carriers || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách nhà xe')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCarriers()
  }, [])

  const stats = useMemo(() => {
    return carriers.reduce(
      (result, carrier) => {
        result.total += 1
        if (carrier.approved) result.approved += 1
        else result.pending += 1
        if (carrier.status === 'active') result.active += 1
        return result
      },
      { total: 0, approved: 0, pending: 0, active: 0 }
    )
  }, [carriers])

  const filteredCarriers = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return carriers.filter((carrier) => {
      if (filterApproved !== 'all') {
        const expected = filterApproved === 'approved'
        if (Boolean(carrier.approved) !== expected) return false
      }

      if (filterStatus !== 'all' && carrier.status !== filterStatus) return false

      if (!keyword) return true
      return [carrier.name, carrier.email, carrier.phone, carrier.address, carrier.owner?.fullName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    })
  }, [carriers, filterApproved, filterStatus, query])

  const resetForm = () => {
    setEditingId(null)
    setShowForm(false)
    setForm(emptyForm)
  }

  const startCreate = () => {
    setError('')
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const startEdit = (carrier) => {
    setError('')
    setEditingId(carrier.id)
    setForm({
      name: carrier.name || '',
      email: carrier.email || '',
      phone: carrier.phone || '',
      address: carrier.address || '',
      approved: Boolean(carrier.approved),
      status: carrier.status || 'inactive',
    })
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên nhà xe')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        approved: Boolean(form.approved),
        status: form.status,
      }

      if (editingId) await adminApi.updateCarrier(editingId, payload)
      else await adminApi.createCarrier(payload)

      resetForm()
      await loadCarriers()
    } catch (err) {
      setError(err.message || 'Không thể lưu nhà xe')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id) => {
    setSaving(true)
    setError('')
    try {
      await adminApi.approveCarrier(id)
      await loadCarriers()
    } catch (err) {
      setError(err.message || 'Không thể duyệt nhà xe')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (carrier) => {
    const nextStatus = carrier.status === 'active' ? 'inactive' : 'active'
    setSaving(true)
    setError('')
    try {
      await adminApi.setCarrierStatus(carrier.id, nextStatus)
      await loadCarriers()
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái nhà xe')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (carrier) => {
    const ok = window.confirm(`Xóa nhà xe "${carrier.name}"? Chỉ nên xóa khi nhà xe chưa có dữ liệu liên quan.`)
    if (!ok) return

    setSaving(true)
    setError('')
    try {
      await adminApi.deleteCarrier(carrier.id)
      await loadCarriers()
      if (editingId === carrier.id) resetForm()
    } catch (err) {
      setError(err.message || 'Không thể xóa nhà xe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-red-600">Admin</p>
          <h1 className="text-3xl font-black text-slate-950">Quản lý nhà xe</h1>
          <p className="mt-1 font-semibold text-slate-500">
            Duyệt nhà xe mới, cập nhật thông tin và điều chỉnh trạng thái hoạt động.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              loadCarriers()
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <FaSyncAlt />
            Làm mới
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700"
          >
            <FaPlus />
            Thêm nhà xe
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tổng nhà xe" value={stats.total} />
        <StatCard label="Đã duyệt" value={stats.approved} tone="green" />
        <StatCard label="Chờ duyệt" value={stats.pending} tone="amber" />
        <StatCard label="Đang hoạt động" value={stats.active} tone="blue" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại, địa chỉ..."
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-red-500"
            />
          </div>

          <FilterSelect value={filterApproved} onChange={setFilterApproved}>
            <option value="all">Duyệt: tất cả</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
          </FilterSelect>

          <FilterSelect value={filterStatus} onChange={setFilterStatus}>
            <option value="all">Trạng thái: tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </FilterSelect>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border-b border-slate-100 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {editingId ? 'Sửa thông tin nhà xe' : 'Thêm nhà xe'}
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  Nhà xe đăng ký từ trang public sẽ có tài khoản chủ sở hữu đi kèm.
                </p>
                {!editingId && (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    Mat khau mac dinh cho tai khoan nha xe moi: 123456.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField label="Tên nhà xe" value={form.name} onChange={(value) => setFormField('name', value, setForm)} />
              <TextField label="Email" value={form.email} onChange={(value) => setFormField('email', value, setForm)} />
              <TextField label="Số điện thoại" value={form.phone} onChange={(value) => setFormField('phone', value, setForm)} />
              <TextField label="Địa chỉ" value={form.address} onChange={(value) => setFormField('address', value, setForm)} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.approved}
                    onChange={(event) => setFormField('approved', event.target.checked, setForm)}
                  />
                  Đã duyệt
                </label>
                <select
                  value={form.status}
                  onChange={(event) => setFormField('status', event.target.value, setForm)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-red-500"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu nhà xe'}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nhà xe</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Duyệt</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-semibold text-slate-500">
                    Đang tải danh sách nhà xe...
                  </td>
                </tr>
              ) : filteredCarriers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center font-semibold text-slate-500">
                    Không có nhà xe phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCarriers.map((carrier) => (
                  <tr key={carrier.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-black text-slate-950">{carrier.name}</div>
                      <div className="mt-1 max-w-xs text-sm font-semibold text-slate-500">{carrier.address || 'Chưa có địa chỉ'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">{carrier.email || 'Chưa có email'}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-500">{carrier.phone || 'Chưa có số điện thoại'}</div>
                    </td>
                    <td className="px-4 py-4">
                      {carrier.owner ? (
                        <>
                          <div className="font-bold text-slate-800">{carrier.owner.fullName}</div>
                          <div className="mt-1 text-sm font-semibold text-slate-500">{carrier.owner.email}</div>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">Chưa gắn tài khoản</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge active={carrier.approved} activeText="Đã duyệt" inactiveText="Chờ duyệt" />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        active={carrier.status === 'active'}
                        activeText="Hoạt động"
                        inactiveText="Không hoạt động"
                        tone={carrier.status === 'active' ? 'blue' : 'slate'}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!carrier.approved && (
                          <IconButton label="Duyệt" icon={<FaCheck />} onClick={() => handleApprove(carrier.id)} />
                        )}
                        <IconButton label="Sửa" icon={<FaEdit />} variant="light" onClick={() => startEdit(carrier)} />
                        <IconButton
                          label={carrier.status === 'active' ? 'Tắt' : 'Bật'}
                          icon={<FaPowerOff />}
                          variant={carrier.status === 'active' ? 'dark' : 'blue'}
                          onClick={() => handleToggleStatus(carrier)}
                        />
                        <IconButton label="Xóa" icon={<FaTrash />} variant="danger" onClick={() => handleDelete(carrier)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function setFormField(field, value, setForm) {
  setForm((current) => ({ ...current, [field]: value }))
}

function StatCard({ label, value, tone = 'slate' }) {
  const toneClass = {
    slate: 'bg-slate-950 text-white',
    green: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    blue: 'bg-blue-600 text-white',
  }[tone]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className={`mt-3 inline-flex min-w-16 justify-center rounded-lg px-3 py-2 text-2xl font-black ${toneClass}`}>
        {value}
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <FaFilter className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-bold text-slate-700 outline-none focus:border-red-500 lg:w-56"
      >
        {children}
      </select>
    </div>
  )
}

function TextField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-red-500"
      />
    </label>
  )
}

function StatusBadge({ active, activeText, inactiveText, tone = 'green' }) {
  const activeClass = tone === 'blue'
    ? 'border-blue-200 bg-blue-50 text-blue-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  return (
    <span
      className={
        'inline-flex rounded-full border px-3 py-1 text-xs font-black ' +
        (active ? activeClass : 'border-amber-200 bg-amber-50 text-amber-700')
      }
    >
      {active ? activeText : inactiveText}
    </span>
  )
}

function IconButton({ label, icon, onClick, variant = 'primary' }) {
  const className = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    light: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    dark: 'bg-slate-900 text-white hover:bg-slate-800',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  }[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${className}`}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

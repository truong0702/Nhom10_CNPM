import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import adminApi from '../services/adminApi'

export default function AdminFeedbackManagement() {
  const navigate = useNavigate()
  const { user, isAdmin, loading } = useAuth()

  const [feedbacks, setFeedbacks] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Reply states
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [updateStatus, setUpdateStatus] = useState('reviewed')

  const loadFeedbacks = async () => {
    setIsRefreshing(true)
    setError('')
    try {
      const response = await adminApi.getFeedbacks()
      // Feedbacks list is returned as { feedbacks: [...] }
      setFeedbacks(response.feedbacks || [])
    } catch (e) {
      console.error(e)
      setError(e.message || 'Không thể tải danh sách góp ý & khiếu nại')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!loading && user && !isAdmin()) {
      navigate('/', { replace: true })
      return
    }

    if (!loading && user && isAdmin()) {
      loadFeedbacks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  // Count items for statistics
  const stats = useMemo(() => {
    const total = feedbacks.length
    const pending = feedbacks.filter((f) => f.status === 'pending').length
    const reviewed = feedbacks.filter((f) => f.status === 'reviewed').length
    const resolved = feedbacks.filter((f) => f.status === 'resolved').length
    const complaint = feedbacks.filter((f) => f.type === 'complaint').length
    return { total, pending, reviewed, resolved, complaint }
  }, [feedbacks])

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      const matchType = typeFilter === 'all' || f.type === typeFilter
      return matchStatus && matchType
    })
  }, [feedbacks, statusFilter, typeFilter])

  const handleOpenReply = (fb) => {
    setActiveReplyId(fb.id)
    setReplyText(fb.adminReply || '')
    setUpdateStatus(fb.status === 'pending' ? 'reviewed' : fb.status)
    setSuccess('')
    setError('')
  }

  const handleSaveReply = async (id) => {
    setError('')
    setSuccess('')
    try {
      await adminApi.updateFeedback(id, {
        status: updateStatus,
        adminReply: replyText.trim() || null,
      })
      setSuccess('Cập nhật phản hồi thành công!')
      setActiveReplyId(null)
      loadFeedbacks()
    } catch (e) {
      setError(e.message || 'Không thể cập nhật phản hồi')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'reviewed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'resolved':
        return 'Đã giải quyết'
      case 'reviewed':
        return 'Đang xử lý/Đã xem'
      case 'pending':
      default:
        return 'Chưa xem'
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/60 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Quản lý góp ý & khiếu nại</h1>
            <p className="text-slate-500 font-semibold mt-1">
              Xem và giải quyết các khiếu nại, đóng góp ý kiến từ khách hàng
            </p>
          </div>
          <button
            onClick={loadFeedbacks}
            disabled={isRefreshing}
            className="px-5 py-2.5 rounded-xl bg-white border-2 border-gray-200 text-slate-700 font-bold hover:bg-gray-50 active:bg-gray-100 transition shadow-sm inline-flex items-center justify-center gap-2"
          >
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 bg-red-100 text-red-800 border border-red-300 px-4 py-3 rounded-xl font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-100 text-green-800 border border-green-300 px-4 py-3 rounded-xl font-semibold">
            {success}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
            <div className="text-xs font-bold text-slate-400 uppercase">Tất cả</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
            <div className="text-xs font-bold text-amber-500 uppercase">Chưa xem</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
            <div className="text-xs font-bold text-indigo-500 uppercase">Đã xem</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{stats.reviewed}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
            <div className="text-xs font-bold text-green-500 uppercase">Đã giải quyết</div>
            <div className="text-2xl font-black text-green-600 mt-1">{stats.resolved}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Phân loại</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold bg-white text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="feedback">Góp ý (Feedback)</option>
              <option value="complaint">Khiếu nại (Complaint)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold bg-white text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chưa xem</option>
              <option value="reviewed">Đang xử lý/Đã xem</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-slate-400 font-semibold">
            Hiển thị {filteredFeedbacks.length} kết quả
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-slate-500 font-semibold shadow-sm">
              Không có góp ý hay khiếu nại nào phù hợp bộ lọc
            </div>
          ) : (
            filteredFeedbacks.map((fb) => {
              const isReplying = activeReplyId === fb.id
              return (
                <div
                  key={fb.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-1 rounded-md ${
                            fb.type === 'complaint'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          {fb.type === 'complaint' ? 'Khiếu nại' : 'Góp ý'}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(fb.status)}`}>
                          {getStatusText(fb.status)}
                        </span>
                      </div>
                      
                      <div className="mt-3 text-slate-800 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                        {fb.content}
                      </div>

                      {/* Sender details */}
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          Khách hàng: <span className="text-slate-800 font-bold">{fb.User?.fullName || 'N/A'}</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200 hidden sm:block"></div>
                        <div>
                          Email: <span className="text-slate-800 font-bold">{fb.User?.email || 'N/A'}</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200 hidden sm:block"></div>
                        <div>
                          SĐT: <span className="text-slate-800 font-bold">{fb.User?.phone || 'N/A'}</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200 hidden sm:block"></div>
                        <div>
                          Gửi lúc: <span className="text-slate-800 font-bold">{new Date(fb.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenReply(fb)}
                        className="px-4 py-2 text-sm rounded-xl font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 transition text-slate-700"
                      >
                        {fb.adminReply ? 'Xem/Sửa phản hồi' : 'Phản hồi khách'}
                      </button>
                    </div>
                  </div>

                  {/* Associated Booking info */}
                  {fb.Booking && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Thông tin vé liên quan:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-red-50/30 p-3 rounded-xl border border-red-500/10 text-xs text-slate-600 font-semibold">
                        <div>Mã đơn vé: <span className="text-slate-900 font-bold">#{fb.Booking.id}</span></div>
                        {fb.Booking.Trip && (
                          <>
                            <div>Tuyến xe: <span className="text-slate-900 font-bold">{fb.Booking.Trip.from} → {fb.Booking.Trip.to}</span></div>
                            <div>Xe: <span className="text-slate-900 font-bold">{fb.Booking.Trip.bus}</span></div>
                          </>
                        )}
                        <div>Ngày đi: <span className="text-slate-900 font-bold">{fb.Booking.Trip ? `${fb.Booking.Trip.date} lúc ${fb.Booking.Trip.departure}` : '—'}</span></div>
                        <div>Tổng tiền: <span className="text-slate-900 font-bold">{Number(fb.Booking.total).toLocaleString('vi-VN')}đ</span></div>
                      </div>
                    </div>
                  )}

                  {/* Existing Admin Reply details */}
                  {fb.adminReply && !isReplying && (
                    <div className="mt-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4">
                      <div className="text-xs font-black text-indigo-700 uppercase tracking-wider">Phản hồi của hệ thống:</div>
                      <div className="text-slate-700 text-sm font-semibold mt-1 whitespace-pre-wrap">{fb.adminReply}</div>
                    </div>
                  )}

                  {/* Reply Form */}
                  {isReplying && (
                    <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
                      <div className="bg-slate-50 border rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-slate-800">
                            {fb.adminReply ? 'Chỉnh sửa phản hồi' : 'Tạo phản hồi mới cho khách hàng'}
                          </h3>
                          <button
                            onClick={() => setActiveReplyId(null)}
                            className="text-xs text-slate-400 font-bold hover:text-slate-600"
                          >
                            Đóng lại
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                            Nội dung phản hồi (Gửi email/hiển thị cho khách)
                          </label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 font-semibold text-sm"
                            placeholder="Nhập nội dung phản hồi khách hàng tại đây..."
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Cập nhật trạng thái:</label>
                            <select
                              value={updateStatus}
                              onChange={(e) => setUpdateStatus(e.target.value)}
                              className="px-3 py-1.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-red-500 font-semibold bg-white text-xs"
                            >
                              <option value="pending">Chưa xem</option>
                              <option value="reviewed">Đang xử lý / Đã xem</option>
                              <option value="resolved">Đã giải quyết</option>
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReplyId(null)}
                              className="px-4 py-2 text-xs rounded-xl font-bold bg-white hover:bg-slate-50 border border-gray-200 text-slate-600"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveReply(fb.id)}
                              className="px-4 py-2 text-xs rounded-xl font-black bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md shadow-red-500/10"
                            >
                              Cập nhật phản hồi
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import paymentApi from '../services/paymentApi'

export default function AdminPaymentManagement() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [stats, setStats] = useState({ pending: 0, verified: 0, failed: 0 })
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [verifyForm, setVerifyForm] = useState({
    bankSenderName: '',
    bankSenderAccount: '',
    transactionRef: '',
    bankTransferDate: '',
    bankTransferTime: '',
    verificationNote: '',
  })
  const [actionStatus, setActionStatus] = useState('idle')

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPayments()
      fetchStats()
    }
  }, [user, filter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      let response
      if (filter === 'pending') {
        response = await paymentApi.getPendingBankTransfers()
      } else {
        response = await paymentApi.getAllPayments(filter, null)
      }
      setPayments(response.payments || [])
    } catch (err) {
      console.error('Failed to fetch payments:', err)
      alert('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [pendingRes, verifiedRes, failedRes] = await Promise.all([
        paymentApi.getPendingBankTransfers(),
        paymentApi.getAllPayments('verified', null).catch(() => ({ payments: [] })),
        paymentApi.getAllPayments('failed', null).catch(() => ({ payments: [] })),
      ])
      setStats({
        pending: pendingRes.count || pendingRes.payments?.length || 0,
        verified: verifiedRes.total || verifiedRes.payments?.length || 0,
        failed: failedRes.total || failedRes.payments?.length || 0,
      })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleVerify = async (paymentId) => {
    if (!verifyForm.bankSenderName || !verifyForm.transactionRef) {
      alert('Vui lòng điền tên người gửi và mã giao dịch')
      return
    }

    try {
      setActionStatus('verifying')
      await paymentApi.verifyBankTransfer(paymentId, verifyForm)
      alert('✅ Thanh toán đã được xác nhận!')
      setSelectedPayment(null)
      setVerifyForm({
        bankSenderName: '',
        bankSenderAccount: '',
        transactionRef: '',
        bankTransferDate: '',
        bankTransferTime: '',
        verificationNote: '',
      })
      fetchPayments()
      fetchStats()
    } catch (err) {
      alert('❌ Lỗi: ' + err.message)
    } finally {
      setActionStatus('idle')
    }
  }

  const handleReject = async (paymentId) => {
    const reason = prompt('Nhập lý do từ chối:')
    if (!reason) return

    try {
      setActionStatus('rejecting')
      await paymentApi.rejectBankTransfer(paymentId, reason)
      alert('✅ Thanh toán đã được từ chối!')
      fetchPayments()
      fetchStats()
    } catch (err) {
      alert('❌ Lỗi: ' + err.message)
    } finally {
      setActionStatus('idle')
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">❌ Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn cần quyền admin để xem trang này</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quản lý thanh toán</h1>
        <p className="text-gray-600">Xác nhận hoặc từ chối các chuyển khoản ngân hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setFilter('pending')} className={`rounded-xl p-4 text-left transition ${filter === 'pending' ? 'ring-2 ring-blue-400' : ''} bg-blue-50 border border-blue-200`}>
          <div className="text-sm text-blue-600 font-semibold">Chờ xác nhận</div>
          <div className="text-3xl font-bold text-blue-900">{stats.pending}</div>
        </button>
        <button onClick={() => setFilter('verified')} className={`rounded-xl p-4 text-left transition ${filter === 'verified' ? 'ring-2 ring-green-400' : ''} bg-green-50 border border-green-200`}>
          <div className="text-sm text-green-600 font-semibold">Đã xác nhận</div>
          <div className="text-3xl font-bold text-green-900">{stats.verified}</div>
        </button>
        <button onClick={() => setFilter('failed')} className={`rounded-xl p-4 text-left transition ${filter === 'failed' ? 'ring-2 ring-red-400' : ''} bg-red-50 border border-red-200`}>
          <div className="text-sm text-red-600 font-semibold">Từ chối</div>
          <div className="text-3xl font-bold text-red-900">{stats.failed}</div>
        </button>
      </div>

      {/* Payments List */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-lg">
            {filter === 'pending' ? 'Danh sách chờ xác nhận' : filter === 'verified' ? 'Đã xác nhận' : 'Đã từ chối'}
          </h2>
          <div className="flex gap-2">
            {['pending', 'verified', 'failed'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-xs font-semibold transition ${filter === f ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f === 'pending' ? 'Chờ' : f === 'verified' ? 'Đã XN' : 'Từ chối'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filter === 'pending' ? 'Không có thanh toán chờ xác nhận' : filter === 'verified' ? 'Chưa có thanh toán được xác nhận' : 'Chưa có thanh toán bị từ chối'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Số tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono">{payment.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm">{payment.booking?.items?.[0]?.passengerName || payment.user?.fullName}</div>
                      <div className="text-xs text-gray-500">{payment.booking?.items?.[0]?.passengerEmail || payment.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {(payment.amount || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === 'pending' ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Chờ xác nhận</span>
                      ) : payment.status === 'verified' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Đã xác nhận</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Từ chối</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      {payment.status === 'pending' ? (
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
                        >
                          Kiểm tra
                        </button>
                      ) : payment.verifiedAt ? (
                        <span className="text-xs text-gray-500">
                          {new Date(payment.verifiedAt).toLocaleDateString('vi-VN')}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Payment Details */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-50 border-b p-4 flex items-center justify-between">
              <h3 className="font-bold">Chi tiết thanh toán</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Booking Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-600 mb-2">THÔNG TIN ĐƠN HÀNG</div>
                <div className="text-sm">
                  <div className="font-semibold">Booking ID:</div>
                  <div className="text-xs font-mono text-gray-600">{selectedPayment.bookingId}</div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-purple-600 mb-2">THÔNG TIN KHÁCH HÀNG</div>
                <div className="space-y-1 text-sm">
                  <div><span className="font-semibold">Tên:</span> {selectedPayment.booking?.items?.[0]?.passengerName || selectedPayment.user?.fullName}</div>
                  <div><span className="font-semibold">Email:</span> {selectedPayment.booking?.items?.[0]?.passengerEmail || selectedPayment.user?.email}</div>
                  <div><span className="font-semibold">SĐT:</span> {selectedPayment.booking?.items?.[0]?.passengerPhone || selectedPayment.user?.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-600 mb-2">SỐ TIỀN</div>
                <div className="text-2xl font-bold text-red-600">
                  {(selectedPayment.amount || 0).toLocaleString('vi-VN')}đ
                </div>
              </div>

              {/* Verify Form */}
              <div className="space-y-2 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Tên người gửi</label>
                  <input
                    type="text"
                    value={verifyForm.bankSenderName}
                    onChange={(e) => setVerifyForm({ ...verifyForm, bankSenderName: e.target.value })}
                    placeholder="Tên trên sổ tiết kiệm"
                    className="w-full px-2 py-1 border rounded text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">STK người gửi</label>
                  <input
                    type="text"
                    value={verifyForm.bankSenderAccount}
                    onChange={(e) => setVerifyForm({ ...verifyForm, bankSenderAccount: e.target.value })}
                    placeholder="Số tài khoản"
                    className="w-full px-2 py-1 border rounded text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Mã giao dịch</label>
                  <input
                    type="text"
                    value={verifyForm.transactionRef}
                    onChange={(e) => setVerifyForm({ ...verifyForm, transactionRef: e.target.value })}
                    placeholder="Ref code"
                    className="w-full px-2 py-1 border rounded text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Ngày chuyển</label>
                  <input
                    type="date"
                    value={verifyForm.bankTransferDate}
                    onChange={(e) => setVerifyForm({ ...verifyForm, bankTransferDate: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700">Ghi chú</label>
                  <textarea
                    value={verifyForm.verificationNote}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verificationNote: e.target.value })}
                    placeholder="Ghi chú thêm"
                    className="w-full px-2 py-1 border rounded text-xs mt-1 h-16"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t bg-gray-50 p-4 flex gap-2">
              <button
                onClick={() => {
                  handleReject(selectedPayment.id)
                  setSelectedPayment(null)
                }}
                disabled={actionStatus !== 'idle'}
                className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded text-sm disabled:opacity-50"
              >
                Từ chối
              </button>
              <button
                onClick={() => handleVerify(selectedPayment.id)}
                disabled={actionStatus !== 'idle'}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded text-sm disabled:opacity-50"
              >
                {actionStatus === 'verifying' ? 'Đang xác nhận...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

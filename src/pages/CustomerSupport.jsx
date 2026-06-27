import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'

// ─── FAQ Data (UC53) ───
const FAQ_DATA = [
  { q: 'Làm sao để đặt vé xe?', a: 'Bạn vào trang chủ, chọn tuyến xe, chọn ghế, điền thông tin hành khách rồi thanh toán.' },
  { q: 'Tôi có thể hủy vé không?', a: 'Có. Vào "Vé của tôi", chọn vé cần hủy và nhấn nút Hủy vé. Phí hủy là 10% giá vé.' },
  { q: 'Phương thức thanh toán nào được hỗ trợ?', a: 'Chúng tôi hỗ trợ thanh toán qua Ví điện tử, Chuyển khoản ngân hàng và Thanh toán tại trạm.' },
  { q: 'Làm sao để đổi vé?', a: 'Vào "Vé của tôi", chọn vé cần đổi và nhấn nút Đổi vé. Phí đổi vé là 5% giá vé.' },
  { q: 'Tôi quên mật khẩu thì phải làm sao?', a: 'Nhấn "Quên mật khẩu" ở trang đăng nhập, nhập email và làm theo hướng dẫn.' },
  { q: 'Mã QR vé dùng để làm gì?', a: 'Mã QR chứa thông tin vé của bạn. Nhân viên soát vé sẽ quét mã QR khi bạn lên xe.' },
  { q: 'Tôi có thể xem lịch sử đặt vé không?', a: 'Có. Vào "Vé của tôi" để xem toàn bộ lịch sử đặt vé, bao gồm vé đã hủy.' },
  { q: 'Làm sao để liên hệ nhà xe?', a: 'Bạn có thể gửi góp ý/khiếu nại qua tab "Gửi góp ý" hoặc chat trực tuyến tại đây.' },
  { q: 'Thời gian hoàn tiền sau khi hủy vé?', a: 'Tiền sẽ được hoàn vào ví điện tử ngay lập tức sau khi hủy vé thành công.' },
  { q: 'Tôi có thể chọn ghế cụ thể không?', a: 'Có. Trong bước chọn ghế, bạn sẽ thấy sơ đồ ghế và có thể chọn ghế mong muốn.' },
]

// ─── Chat bot auto-replies (UC51) ───
const BOT_REPLIES = [
  'Cảm ơn bạn đã liên hệ! Nhân viên hỗ trợ sẽ phản hồi trong thời gian sớm nhất.',
  'Bạn có thể cho mình biết thêm chi tiết về vấn đề không?',
  'Mình đã ghi nhận yêu cầu của bạn. Vui lòng chờ trong giây lát.',
  'Nếu bạn cần hỗ trợ gấp, vui lòng gọi hotline: 1900 1234.',
  'Cảm ơn bạn đã cung cấp thông tin. Mình sẽ kiểm tra và phản hồi ngay.',
  'Bạn đã thử đăng xuất rồi đăng nhập lại chưa? Thao tác này thường giải quyết được nhiều lỗi.',
]

const TABS = [
  { id: 'feedback', label: '📝 Gửi góp ý' },
  { id: 'chat', label: '💬 Chat hỗ trợ' },
  { id: 'faq', label: '❓ FAQ' },
]

export default function CustomerSupport() {
  const [activeTab, setActiveTab] = useState('feedback')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-2 text-3xl font-black text-gray-900">Chăm sóc khách hàng</h1>
        <p className="mb-6 text-sm text-gray-500">Gửi góp ý, chat hỗ trợ hoặc tìm câu trả lời nhanh</p>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-gray-200 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'feedback' && <FeedbackTab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'faq' && <FaqTab />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
//  UC52 — Khảo sát mức độ hài lòng sau hỗ trợ
// ═══════════════════════════════════════════
function SurveyForm({ feedbackId, onSubmitted }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiClient.post('/customer/support-survey', {
        feedbackId,
        rating,
        comment: comment.trim() || undefined,
      })
      onSubmitted()
    } catch (err) {
      setError(err.message || 'Lỗi gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t border-dashed border-gray-200 pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase">Đánh giá độ hài lòng:</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-lg hover:scale-110 active:scale-95 transition"
            >
              {star <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nhận xét ngắn về hỗ trợ này (không bắt buộc)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white font-semibold"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50 transition"
        >
          {submitting ? 'Đang gửi...' : 'Gửi'}
        </button>
      </div>
      {error && <p className="text-[10px] font-bold text-red-600">{error}</p>}
    </form>
  )
}

// ═══════════════════════════════════════════
//  UC50 — Gửi góp ý & khiếu nại
// ═══════════════════════════════════════════
function FeedbackTab() {
  const { user } = useAuth()
  const [type, setType] = useState('feedback')
  const [bookingId, setBookingId] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [userBookings, setUserBookings] = useState([])

  useEffect(() => {
    loadFeedbacks()
    if (user) {
      loadUserBookings()
    }
  }, [user])

  const loadFeedbacks = async () => {
    try {
      const data = await apiClient.get('/feedback')
      setFeedbacks(data.feedbacks || [])
    } catch {
      /* ignore */
    } finally {
      setLoadingList(false)
    }
  }

  const loadUserBookings = async () => {
    try {
      const data = await apiClient.get('/bookings')
      setUserBookings(data.bookings || [])
    } catch (e) {
      console.error('Failed to load user bookings:', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return setError('Vui lòng nhập nội dung')
    setError('')
    setSending(true)
    try {
      await apiClient.post('/feedback', {
        type,
        bookingId: bookingId || undefined,
        content: content.trim(),
      })
      setSent(true)
      setContent('')
      setBookingId('')
      loadFeedbacks()
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setSending(false)
    }
  }

  const statusLabel = { pending: '⏳ Chờ xử lý', reviewed: '👀 Đã xem', resolved: '✅ Đã giải quyết' }
  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', reviewed: 'bg-blue-100 text-blue-700', resolved: 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black text-gray-900">Gửi góp ý / khiếu nại</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
              <input type="radio" name="type" value="feedback" checked={type === 'feedback'} onChange={() => setType('feedback')} className="accent-red-600" />
              Góp ý
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold has-[:checked]:border-red-300 has-[:checked]:bg-red-50">
              <input type="radio" name="type" value="complaint" checked={type === 'complaint'} onChange={() => setType('complaint')} className="accent-red-600" />
              Khiếu nại
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Vé xe liên quan (Không bắt buộc)</label>
            <select
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white font-semibold"
            >
              <option value="">-- Không chọn vé / Không liên quan --</option>
              {userBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  Vé #{b.id.substring(0, 8)}: {b.Trip?.from} → {b.Trip?.to} ({b.Trip?.date ? new Date(b.Trip.date).toLocaleDateString('vi-VN') : ''} lúc {b.Trip?.departure || ''})
                </option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Nhập nội dung góp ý hoặc khiếu nại của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
          />

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
          {sent && <p className="text-sm font-bold text-green-600">✅ Gửi góp ý thành công!</p>}

          <button
            type="submit"
            disabled={sending || !user}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
          >
            {!user ? 'Vui lòng đăng nhập' : sending ? 'Đang gửi...' : 'Gửi góp ý'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black text-gray-900">Lịch sử góp ý & khiếu nại</h2>
        {loadingList ? (
          <p className="text-sm text-gray-400">Đang tải...</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-sm text-gray-400">Bạn chưa gửi góp ý nào</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-gray-400">
                    {fb.type === 'complaint' ? '🚨 Khiếu nại' : '💬 Góp ý'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor[fb.status] || ''}`}>
                    {statusLabel[fb.status] || fb.status}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{fb.content}</p>
                {fb.adminReply && (
                  <div className="mt-2 rounded-lg bg-blue-50 p-3">
                    <p className="text-xs font-bold text-blue-600">Phản hồi từ Admin:</p>
                    <p className="mt-1 text-sm text-blue-800">{fb.adminReply}</p>
                  </div>
                )}

                {/* UC52 - Satisfaction Survey Form */}
                {fb.SupportSurvey && (
                  <div className="mt-3 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-500 flex items-center gap-1.5 font-bold">
                    <span>Đánh giá của bạn:</span>
                    <span className="text-yellow-500">
                      {'★'.repeat(fb.SupportSurvey.rating) + '☆'.repeat(5 - fb.SupportSurvey.rating)}
                    </span>
                    {fb.SupportSurvey.comment && (
                      <span className="text-gray-400 italic"> - "{fb.SupportSurvey.comment}"</span>
                    )}
                  </div>
                )}
                {!fb.SupportSurvey && (fb.status === 'resolved' || fb.status === 'reviewed') && (
                  <SurveyForm feedbackId={fb.id} onSubmitted={loadFeedbacks} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
//  UC51 — Chat trực tuyến hỗ trợ
// ═══════════════════════════════════════════
function ChatTab() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const endRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const loadMessages = async (silent = false) => {
    if (!user) return
    try {
      const data = await apiClient.get('/chat')
      setMessages(data.messages || [])
    } catch (e) {
      console.error('Failed to load chat messages:', e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadMessages()
      pollIntervalRef.current = setInterval(() => {
        loadMessages(true)
      }, 3000)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [user])


  const sendMessage = async () => {
    if (!input.trim() || !user) return
    const text = input.trim()
    setInput('')
    try {
      const res = await apiClient.post('/chat', { content: text })
      if (res.chatMessage) {
        setMessages((prev) => [...prev, res.chatMessage])
      } else {
        loadMessages(true)
      }
    } catch (err) {
      console.error('Failed to send chat message:', err)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const fmtTime = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg">👩‍💼</div>
        <div>
          <div className="text-sm font-black text-gray-900">Hỗ trợ trực tuyến Vexere</div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            Tư vấn viên đang online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 bg-slate-50/30">
        {loading && user ? (
          <p className="text-center text-sm text-gray-400 py-4">Đang kết nối...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-gray-500">Xin chào! 👋</p>
            <p className="text-xs text-gray-400 mt-1">Gửi tin nhắn bên dưới để bắt đầu chat với hỗ trợ viên.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.senderRole === 'user'
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isUser
                      ? 'rounded-br-md bg-red-600 text-white'
                      : 'rounded-bl-md bg-white text-gray-800 border border-gray-100'
                    }`}
                >
                  <p className="font-semibold leading-relaxed">{msg.content}</p>
                  <p className={`mt-1 text-[10px] text-right font-normal ${isUser ? 'text-red-200' : 'text-gray-400'}`}>
                    {fmtTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        {!user ? (
          <p className="text-center text-sm font-bold text-gray-400 py-1.5">Vui lòng đăng nhập để chat</p>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập tin nhắn hỗ trợ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-50 transition duration-200"
            >
              Gửi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
//  UC53 — Trung tâm trợ giúp (FAQ)
// ═══════════════════════════════════════════
function FaqTab() {
  const [search, setSearch] = useState('')
  const [openIdx, setOpenIdx] = useState(null)
  const [faqs, setFaqs] = useState(FAQ_DATA)

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await apiClient.get('/support/faqs')
        if (response && response.faqs) {
          setFaqs(response.faqs)
        }
      } catch (err) {
        console.error('Failed to fetch FAQs from backend:', err)
      }
    }
    fetchFaqs()
  }, [])

  const filtered = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm câu hỏi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
        />
      </div>

      {/* FAQ list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Không tìm thấy câu hỏi phù hợp</p>
        ) : (
          filtered.map((item, idx) => {
            const isOpen = openIdx === idx
            return (
              <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-gray-900 hover:bg-gray-50"
                >
                  <span>{item.q}</span>
                  <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-600">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

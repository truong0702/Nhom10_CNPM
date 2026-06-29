import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaComments, FaPaperPlane, FaTimes } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { apiClient } from '../services/api'

export default function FloatingChatWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  const loadMessages = async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)
    try {
      const response = await apiClient.get('/chat')
      setMessages(response.messages || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Không thể tải tin nhắn')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !user) return undefined
    loadMessages()
    const timer = setInterval(() => loadMessages(true), 3000)
    return () => clearInterval(timer)
  }, [open, user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !user || sending) return
    setInput('')
    setSending(true)
    setError('')

    try {
      const response = await apiClient.post('/chat', { content: text })
      const nextMessages = Array.isArray(response.messages)
        ? response.messages
        : [response.chatMessage, response.autoReply].filter(Boolean)
      setMessages((prev) => [...prev, ...nextMessages])
    } catch (err) {
      setError(err.message || 'Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70]">
      {open && (
        <div className="mb-3 flex h-[520px] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-black">Chat hỗ trợ</div>
              <div className="text-xs font-semibold text-slate-300">Nhân viên sẽ phản hồi trong vài phút</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Đóng chat"
            >
              <FaTimes />
            </button>
          </div>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
                <FaComments />
              </div>
              <div className="text-lg font-black text-slate-900">Đăng nhập để chat</div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Bạn cần đăng nhập để gửi yêu cầu hỗ trợ và nhận phản hồi từ admin.
              </p>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700"
              >
                Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
                {loading ? (
                  <div className="py-8 text-center text-sm font-bold text-slate-400">Đang kết nối...</div>
                ) : messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
                    Xin chào, bạn cần hỗ trợ gì? Gửi tin nhắn tại đây, admin sẽ nhận được yêu cầu.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.senderRole === 'user'
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isUser
                              ? 'rounded-br-md bg-red-600 text-white'
                              : 'rounded-bl-md border border-slate-100 bg-white text-slate-800'
                          }`}
                        >
                          <div className="font-semibold leading-6">{message.content}</div>
                          {message.isAutoReply && (
                            <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-blue-500">
                              Tự động phản hồi
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              {error && (
                <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-2 border-t border-slate-100 p-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Gửi tin nhắn"
                >
                  <FaPaperPlane className="text-sm" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-200 transition hover:bg-red-700"
        aria-label="Mở chat hỗ trợ"
      >
        <FaComments className="text-2xl" />
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-amber-950">
            ?
          </span>
        )}
      </button>
    </div>
  )
}

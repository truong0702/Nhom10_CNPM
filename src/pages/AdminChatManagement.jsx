import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import adminApi from '../services/adminApi'
import { FaPaperPlane, FaComments, FaSync } from 'react-icons/fa'

export default function AdminChatManagement() {
  const navigate = useNavigate()
  const { user, isAdmin, loading } = useAuth()

  const [conversations, setConversations] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [error, setError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && user && !isAdmin()) {
      navigate('/', { replace: true })
    }
  }, [loading, user])

  // Load conversations list
  const loadConversations = async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const res = await adminApi.getConversations()
      setConversations(res.conversations || [])
    } catch (e) {
      console.error('Failed to load conversations:', e)
      setError('Không thể tải danh sách cuộc trò chuyện')
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }

  // Load chat messages for the selected user
  const loadMessages = async (userId, silent = false) => {
    try {
      const res = await adminApi.getChatMessages(userId)
      setMessages(res.messages || [])
    } catch (e) {
      console.error('Failed to load messages:', e)
    }
  }

  // Polling setup
  useEffect(() => {
    if (!loading && user && isAdmin()) {
      loadConversations()

      pollIntervalRef.current = setInterval(() => {
        loadConversations(true)
        if (selectedUserId) {
          loadMessages(selectedUserId, true)
        }
      }, 3000)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [loading, user, selectedUserId])



  // Select user conversation
  const handleSelectUser = (userId) => {
    setSelectedUserId(userId)
    setMessages([])
    loadMessages(userId)
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !selectedUserId || sending) return

    const text = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      const res = await adminApi.sendChatMessage(selectedUserId, { content: text })
      setMessages((prev) => [...prev, res.chatMessage])
      loadConversations(true)
    } catch (e) {
      console.error('Failed to send message:', e)
      setError('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }

  const selectedUser = conversations.find(c => c.userId === selectedUserId)?.user

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-slate-100/60 p-4 gap-4">
      {/* Left sidebar - active conversations */}
      <div className="w-80 flex flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FaComments className="text-red-500" />
            Khách hàng trực tuyến
          </h2>
          <button
            onClick={() => loadConversations()}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:bg-slate-100 transition duration-200"
            title="Làm mới"
          >
            <FaSync className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="py-8 text-center text-sm font-semibold text-slate-400">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.userId === selectedUserId
              return (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectUser(conv.userId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition duration-200 ${
                    isSelected
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 font-semibold'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm ${
                    isSelected ? 'bg-red-500' : 'bg-slate-400'
                  }`}>
                    {conv.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate text-slate-900">
                      {conv.user?.fullName || 'Khách hàng'}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5 font-normal">
                      {conv.lastMessage}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0 font-normal self-start mt-0.5">
                    {formatTime(conv.lastMessageAt)}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right chat panel */}
      <div className="flex-1 flex flex-col rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        {selectedUserId ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {selectedUser?.fullName || 'Khách hàng'}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {selectedUser?.email} {selectedUser?.phone && `• ${selectedUser?.phone}`}
                </p>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50/50 space-y-4">
              {messages.map((msg) => {
                const isAdminMsg = msg.senderRole === 'admin'
                return (
                  <div key={msg.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isAdminMsg
                        ? 'rounded-tr-none bg-red-600 text-white'
                        : 'rounded-tl-none bg-white text-slate-800 border border-slate-100'
                    }`}>
                      <p className="font-semibold leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 text-right font-normal ${
                        isAdminMsg ? 'text-red-200' : 'text-slate-400'
                      }`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Nhập nội dung tin nhắn trả lời..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold bg-slate-50/30"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="h-11 w-11 flex items-center justify-center rounded-2xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition duration-200 shadow-sm"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <FaComments className="text-6xl text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-800 mb-1">Hỗ trợ trực tuyến</h3>
            <p className="text-sm font-bold text-slate-400">Chọn một khách hàng để bắt đầu tư vấn trực tuyến</p>
          </div>
        )}
      </div>
    </div>
  )
}

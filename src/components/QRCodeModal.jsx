import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeModal({ booking, onClose }) {
  if (!booking) return null

  const items = booking.items || []
  const firstItem = items[0] || {}
  const seatLabels = items.flatMap((item) => item.selectedSeatLabels || [])
  const passengerName = firstItem.passengerName || ''
  const passengerPhone = firstItem.passengerPhone || ''
  const trip = booking.Trip || {}

  const qrData = JSON.stringify({
    bookingId: booking.id,
    passenger: passengerName,
    phone: passengerPhone,
    seats: seatLabels,
    route: trip.from && trip.to ? `${trip.from} → ${trip.to}` : (firstItem.title || ''),
    departure: trip.departure || '',
    date: trip.date || '',
    total: booking.total,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <h2 className="text-lg font-black text-gray-900">Mã QR vé #{booking.id?.slice(0, 8)}</h2>
          <p className="mt-1 text-xs text-slate-500">Đưa mã này cho nhân viên nhà xe để quét khi lên xe</p>
        </div>

        <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
          <QRCodeSVG value={qrData} size={200} level="M" />
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
          {passengerName && (
            <div className="flex justify-between">
              <span className="text-slate-500">Hành khách:</span>
              <span className="font-bold text-gray-900">{passengerName}</span>
            </div>
          )}
          {passengerPhone && (
            <div className="flex justify-between">
              <span className="text-slate-500">SĐT:</span>
              <span className="font-bold text-gray-900">{passengerPhone}</span>
            </div>
          )}
          {(trip.from || firstItem.title) && (
            <div className="flex justify-between">
              <span className="text-slate-500">Tuyến:</span>
              <span className="font-bold text-gray-900">
                {trip.from && trip.to ? `${trip.from} → ${trip.to}` : firstItem.title}
              </span>
            </div>
          )}
          {trip.departure && (
            <div className="flex justify-between">
              <span className="text-slate-500">Giờ khởi hành:</span>
              <span className="font-bold text-gray-900">{trip.departure}</span>
            </div>
          )}
          {seatLabels.length > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Số ghế:</span>
              <span className="font-bold text-gray-900">{seatLabels.join(', ')}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500">Tổng tiền:</span>
            <span className="font-bold text-gray-900">
              {Number(booking.total || 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-slate-800"
        >
          Đóng
        </button>
      </div>
    </div>
  )
}

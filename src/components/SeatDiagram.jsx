import { useMemo } from 'react'

export default function SeatDiagram({
  totalSeats,
  selectedSeats,
  lockedSeats,
  onSeatClick,
  vehicleType = 'seating',
  maxSelectable,
  basePrice = 500000,
}) {
  const seatKind = vehicleType === 'sleeping' ? 'nam' : 'ngoi'

  const calculateSeatPrice = (seatNum) => {
    const vipThreshold = Math.floor(totalSeats * 0.65)
    const isVip = seatNum > vipThreshold
    const isPremium = seatNum % 5 === 0 && seatNum !== 5

    if (isPremium) {
      return Math.round(basePrice * 1.25)
    } else if (isVip) {
      return Math.round(basePrice * 1.15)
    }
    return basePrice
  }

  const getSeatLayout = useMemo(() => {
    if (vehicleType === 'sleeping') {
      const rows = []
      const seatsPerRow = 2
      const numRows = Math.ceil(totalSeats / seatsPerRow)

      for (let i = 0; i < numRows; i++) {
        const rowSeats = []
        for (let j = 0; j < seatsPerRow; j++) {
          const seatNum = i * seatsPerRow + j + 1
          if (seatNum <= totalSeats) {
            rowSeats.push(seatNum)
          }
        }
        rows.push(rowSeats)
      }
      return rows
    } else {
      const rows = []
      let seatNum = 1
      const leftSeats = 3
      const rightSeats = 2
      const seatsPerRow = leftSeats + rightSeats
      const numRows = Math.ceil(totalSeats / seatsPerRow)

      for (let i = 0; i < numRows && seatNum <= totalSeats; i++) {
        const rowSeats = { left: [], right: [] }

        for (let j = 0; j < leftSeats && seatNum <= totalSeats; j++) {
          rowSeats.left.push(seatNum++)
        }

        for (let j = 0; j < rightSeats && seatNum <= totalSeats; j++) {
          rowSeats.right.push(seatNum++)
        }

        rows.push(rowSeats)
      }
      return rows
    }
  }, [totalSeats, vehicleType])

  const getSeatStatus = (seatNum) => {
    if (lockedSeats.includes(seatNum)) return 'locked'
    if (selectedSeats.includes(seatNum)) return 'selected'
    return 'available'
  }

  const handleSeatClick = (seatNum) => {
    const status = getSeatStatus(seatNum)
    if (status === 'locked') return
    onSeatClick(seatNum)
  }

  const SeatButton = ({ seatNum }) => {
    const status = getSeatStatus(seatNum)
    const isDisabled =
      status === 'locked' ||
      (status === 'available' && selectedSeats.length >= maxSelectable && !selectedSeats.includes(seatNum))
    
    const price = calculateSeatPrice(seatNum)
    const isVip = seatNum > Math.floor(totalSeats * 0.65)
    const isPremium = seatNum % 5 === 0 && seatNum !== 5

    const titleText = status === 'locked' ? `Cho ${seatNum} da duoc chon` : `Cho ${seatNum}`

    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleSeatClick(seatNum)}
          disabled={isDisabled}
          data-testid={`seat-${seatNum}`}
          className={
            'w-10 h-10 rounded-lg border-2 font-bold text-xs transition ' +
            (status === 'selected'
              ? 'bg-blue-500 border-blue-600 text-white'
              : status === 'locked'
                ? 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed'
                : isDisabled
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-green-300 text-gray-800 hover:bg-green-50 cursor-pointer')
          }
          title={titleText}
        >
          {seatNum}
        </button>
        <div className="text-xs font-semibold text-slate-700">
          {price.toLocaleString('vi-VN')}d
        </div>
        {(isVip || isPremium) && (
          <div className="text-xs text-orange-600 font-bold">
            {isPremium ? 'PREMIUM' : 'VIP'}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-green-300 bg-white"></div>
          <span>Trong</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-blue-600 bg-blue-500 text-white"></div>
          <span>Da chon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border-2 border-gray-400 bg-gray-300"></div>
          <span>Da duoc chon</span>
        </div>
      </div>

      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6">
        {vehicleType === 'sleeping' ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-600 text-center mb-4">
              Tang tren
            </div>
            {getSeatLayout.slice(0, Math.ceil(totalSeats / 4)).map((rowSeats, idx) => (
              <div key={`top-${idx}`} className="flex justify-center gap-4">
                {rowSeats.map((seatNum) => (
                  <SeatButton key={seatNum} seatNum={seatNum} />
                ))}
              </div>
            ))}

            <div className="my-6 border-t-2 border-dashed border-slate-300"></div>

            <div className="text-xs font-semibold text-slate-600 text-center mb-4">
              Tang duoi
            </div>
            {getSeatLayout.slice(Math.ceil(totalSeats / 4)).map((rowSeats, idx) => (
              <div key={`bottom-${idx}`} className="flex justify-center gap-4">
                {rowSeats.map((seatNum) => (
                  <SeatButton key={seatNum} seatNum={seatNum} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-600 text-center mb-4">
              So do cho ngoi
            </div>

            <div className="flex flex-row items-start gap-3 overflow-x-auto pb-2 justify-center">
              {getSeatLayout.map((rowSeats, idx) => (
                <div key={`row-${idx}`} className="flex flex-col justify-start items-center gap-2">
                  <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">Hang {idx + 1}</div>
                  <div className="flex flex-col gap-3">
                    {rowSeats.left.map((seatNum) => (
                      <SeatButton key={seatNum} seatNum={seatNum} />
                    ))}
                    <div className="h-2"></div>
                    {rowSeats.right.map((seatNum) => (
                      <SeatButton key={seatNum} seatNum={seatNum} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

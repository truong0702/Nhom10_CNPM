export default function Cart({ items, total, onCheckout, onUpdateQty }) {
  return (
    <div className="border rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Your cart</div>
          <div className="text-sm text-slate-500">{items.length ? `${items.length} items` : 'Empty'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total</div>
          <div className="font-bold">${total}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((it) => (
            <div key={it.id} className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-xs text-slate-500">${it.price} × {it.qty}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 rounded-lg border hover:bg-slate-50"
                  onClick={() => onUpdateQty(it.id, it.qty - 1)}
                >
                  -
                </button>
                <div className="w-10 text-center font-semibold">{it.qty}</div>
                <button
                  className="w-9 h-9 rounded-lg border hover:bg-slate-50"
                  onClick={() => onUpdateQty(it.id, it.qty + 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">Add trips to see them here.</div>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          className={
            'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ' +
            (items.length
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-slate-200 text-slate-600 cursor-not-allowed')
          }
          disabled={!items.length}
          onClick={onCheckout}
        >
          Checkout
        </button>
      </div>
    </div>
  )
}


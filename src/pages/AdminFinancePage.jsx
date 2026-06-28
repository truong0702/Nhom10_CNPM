import { useState, useEffect } from 'react';
import { 
  FaCalculator, 
  FaChartLine, 
  FaExchangeAlt, 
  FaMoneyBillWave, 
  FaSearchDollar, 
  FaCheckCircle, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import financeAdminApi from '../services/financeAdminApi.js';
import adminApi from '../services/adminApi.js';
import { apiClient } from '../services/api.js';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold';

export default function AdminFinancePage() {
  const [feeForm, setFeeForm] = useState({ amount: 1000000, percent: 5, fixedFee: 0, taxPercent: 10 });
  const [splitForm, setSplitForm] = useState({ paymentId: '', amount: 500000, platformPercent: 10 });
  const [codForm, setCodForm] = useState({ bookingId: '', amount: 300000, collectedBy: '' });
  const [fromTo, setFromTo] = useState({ from: '', to: '' });
  const [bookings, setBookings] = useState([]);
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null); // 'fee', 'split', 'cod', 'reconciliation', 'report'
  const [message, setMessage] = useState('');

  const loadBookings = async () => {
    try {
      const res = await adminApi.getBookings();
      setBookings(res.bookings || []);
    } catch (e) {
      console.error("Failed to load bookings in finance page", e);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const run = async (action, type) => {
    setMessage('');
    setResult(null);
    setResultType(null);
    try {
      const data = await action();
      setResult(data);
      setResultType(type);
      if (type === 'cod' || type === 'split') {
        loadBookings();
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép mã giao dịch: ' + text);
  };

  const handleFillPaymentId = async (paymentId) => {
    try {
      const res = await apiClient.get(`/payments/${paymentId}`);
      if (res.payment) {
        setSplitForm({
          paymentId: res.payment.id,
          amount: res.payment.amount,
          platformPercent: 10
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      alert('Không thể tải thông tin thanh toán: ' + error.message);
    }
  };

  const handleFillBookingId = (booking) => {
    setCodForm({
      bookingId: booking.id,
      amount: booking.total,
      collectedBy: 'Tài xế/Nhân viên quầy'
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="text-sm font-black uppercase tracking-wide text-red-600">Vận hành Tài chính</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Quản lý Doanh thu & Đối soát</h1>
      </section>

      {message && <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() => financeAdminApi.calculateFee(feeForm), 'fee');
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaCalculator /> Ước tính phí dịch vụ
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Số tiền giao dịch (VND)">
              <input className={inputClass} type="number" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} />
            </Field>
            <Field label="Tỷ lệ phí (%)">
              <input className={inputClass} type="number" value={feeForm.percent} onChange={(e) => setFeeForm({ ...feeForm, percent: e.target.value })} />
            </Field>
            <Field label="Phí cố định (VND)">
              <input className={inputClass} type="number" value={feeForm.fixedFee} onChange={(e) => setFeeForm({ ...feeForm, fixedFee: e.target.value })} />
            </Field>
            <Field label="Thuế suất VAT (%)">
              <input className={inputClass} type="number" value={feeForm.taxPercent} onChange={(e) => setFeeForm({ ...feeForm, taxPercent: e.target.value })} />
            </Field>
          </div>
          <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 transition-colors">Tính phí</button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() => financeAdminApi.splitPayment(splitForm), 'split');
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaExchangeAlt /> Phân bổ thanh toán Online
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Mã thanh toán (Payment ID)">
              <input className={inputClass} value={splitForm.paymentId} onChange={(e) => setSplitForm({ ...splitForm, paymentId: e.target.value })} placeholder="Ví dụ: cd89dc80-..." />
            </Field>
            <Field label="Số tiền gộp (VND)">
              <input className={inputClass} type="number" value={splitForm.amount} onChange={(e) => setSplitForm({ ...splitForm, amount: e.target.value })} />
            </Field>
            <Field label="Tỷ lệ Vexere thu (%)">
              <input className={inputClass} type="number" value={splitForm.platformPercent} onChange={(e) => setSplitForm({ ...splitForm, platformPercent: e.target.value })} />
            </Field>
          </div>
          <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-900 transition-colors">Phân bổ ngay</button>
        </form>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaMoneyBillWave /> Ghi nhận doanh thu COD
          </h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                run(() => financeAdminApi.recordCod(codForm), 'cod');
              }}
              className="flex-1 space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Mã đặt vé (Booking ID)">
                  <input className={inputClass} value={codForm.bookingId} onChange={(e) => setCodForm({ ...codForm, bookingId: e.target.value })} placeholder="Dán mã UUID từ vé" />
                </Field>
                <Field label="Số tiền thu hộ (VND)">
                  <input className={inputClass} type="number" value={codForm.amount} onChange={(e) => setCodForm({ ...codForm, amount: e.target.value })} />
                </Field>
                <Field label="Người thu hộ" className="sm:col-span-2">
                  <input className={inputClass} value={codForm.collectedBy} onChange={(e) => setCodForm({ ...codForm, collectedBy: e.target.value })} placeholder="Tên tài xế/Nhân viên" />
                </Field>
              </div>
              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 transition-colors">Ghi nhận COD</button>
            </form>

            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 space-y-3 min-w-[200px] lg:max-w-[260px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn nhanh vé trong hệ thống</h3>
              <div className="overflow-y-auto max-h-48 space-y-2 pr-1">
                {bookings.map((b) => (
                  <div key={b.id} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-3xs font-bold border border-slate-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-slate-700 truncate max-w-[120px]">{b.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-4xs font-black uppercase ${b.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {b.paymentStatus === 'paid' ? 'Đã thu' : 'Chưa thu'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-4xs">
                      <span>{money(b.total)}</span>
                      <button 
                        type="button" 
                        onClick={() => handleFillBookingId(b)}
                        className="text-emerald-600 hover:text-emerald-700 font-black hover:underline"
                      >
                        Điền mã
                      </button>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <p className="text-4xs font-bold text-slate-400 text-center py-6">Không tìm thấy vé nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaSearchDollar /> Đối soát số liệu & Báo cáo
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Từ ngày">
              <input className={inputClass} type="date" value={fromTo.from} onChange={(e) => setFromTo({ ...fromTo, from: e.target.value })} />
            </Field>
            <Field label="Đến ngày">
              <input className={inputClass} type="date" value={fromTo.to} onChange={(e) => setFromTo({ ...fromTo, to: e.target.value })} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => run(() => financeAdminApi.reconciliation(fromTo), 'reconciliation')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors">
              Đối soát số liệu
            </button>
            <button type="button" onClick={() => run(() => financeAdminApi.revenueReport(fromTo), 'report')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-900 transition-colors">
              <FaChartLine /> Báo cáo doanh thu
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xl font-black text-slate-950">Kết quả xử lý</h2>
          {resultType === 'fee' && result?.fee && (
            <span className="text-sm font-black text-red-600">Tổng phí: {money(result.fee.totalFee)}</span>
          )}
        </div>
        
        {!result && <p className="text-sm font-bold text-slate-400 py-4 text-center">Chưa có kết quả xử lý.</p>}
        
        {result && resultType === 'fee' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-500">Số tiền giao dịch gộp:</span>
                <span className="font-bold text-slate-800">{money(result.fee.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-500">Phí dịch vụ cơ bản:</span>
                <span className="font-bold text-slate-800">{money(result.fee.serviceFee)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-500">Thuế suất VAT:</span>
                <span className="font-bold text-slate-800">{money(result.fee.tax)}</span>
              </div>
              <div className="flex justify-between font-bold border-b border-slate-100 pb-2">
                <span className="text-red-600">Tổng chi phí hệ thống:</span>
                <span className="text-red-600">{money(result.fee.totalFee)}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2">
                <span className="text-slate-900">Tổng phải thanh toán (Gộp + Phí):</span>
                <span className="text-slate-950">{money(result.fee.payableAmount)}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center space-y-2 border border-slate-100">
              <FaCalculator className="text-4xl text-red-500" />
              <p className="font-black text-slate-800">Công thức tính phí</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Phí dịch vụ = (Tiền gộp × Tỷ lệ %) + Phí cố định.<br />
                Thuế VAT = Phí dịch vụ × Tỷ lệ thuế.<br />
                Tổng cộng = Tiền gộp + Phí dịch vụ + Thuế VAT.
              </p>
            </div>
          </div>
        )}

        {result && (resultType === 'split' || resultType === 'cod') && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <FaCheckCircle className="text-2xl text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-base font-black">{result.message || 'Ghi nhận giao dịch thành công'}</h3>
                <p className="text-xs font-semibold text-emerald-700">Bản ghi tài chính đã được cập nhật thành công vào cơ sở dữ liệu.</p>
              </div>
            </div>
            {result.record && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-emerald-100 bg-white p-4 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500 font-bold">Mã bản ghi:</span>
                  <span className="font-bold text-slate-800">#{result.record.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500 font-bold">Nguồn ghi nhận:</span>
                  <span className="font-bold text-slate-800">{result.record.source === 'online_split' ? 'Phân bổ Online' : 'Thu hộ COD'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500 font-bold">Mã tham chiếu:</span>
                  <span className="font-mono font-bold text-slate-800">{result.record.referenceId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500 font-bold">Tổng doanh thu gộp:</span>
                  <span className="font-bold text-slate-800">{money(result.record.grossAmount)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-500 font-bold">Vexere nhận (Platform Fee):</span>
                  <span className="font-bold text-emerald-600">{money(result.record.platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500 font-bold">Nhà xe nhận (Carrier Amount):</span>
                  <span className="font-bold text-blue-600">{money(result.record.carrierAmount)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {result && resultType === 'reconciliation' && result.reconciliation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thanh toán thực tế (Payments)</p>
                <p className="mt-1 text-xl font-black text-slate-900">{money(result.reconciliation.paymentTotal)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu sổ sách (Ledger)</p>
                <p className="mt-1 text-xl font-black text-slate-900">{money(result.reconciliation.recordedTotal)}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${result.reconciliation.matched ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lệch sổ sách</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className={`text-xl font-black ${result.reconciliation.matched ? 'text-emerald-700' : 'text-red-600'}`}>
                    {money(result.reconciliation.difference)}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-3xs font-black uppercase ${result.reconciliation.matched ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {result.reconciliation.matched ? 'Khớp' : 'Lệch'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 text-red-600">
                  <FaExclamationTriangle /> Giao dịch chưa được phân bổ ({result.reconciliation.missingRevenueRecords.length})
                </h4>
                <p className="text-3xs font-semibold text-slate-500">Các khoản tiền khách đã trả thành công nhưng Admin chưa phân tách doanh thu cho nhà xe.</p>
                <div className="overflow-y-auto max-h-60 space-y-2 pr-1">
                  {result.reconciliation.missingRevenueRecords.map((id) => (
                    <div key={id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-3xs hover:bg-slate-100 transition-colors border border-slate-100">
                      <span className="font-mono text-slate-700 font-bold break-all select-all">{id}</span>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <button 
                          type="button"
                          onClick={() => copyToClipboard(id)}
                          className="px-2 py-1 text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 font-bold"
                        >
                          Sao chép
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleFillPaymentId(id)}
                          className="px-2 py-1 text-white bg-slate-950 rounded-lg hover:bg-slate-900 font-bold"
                        >
                          Phân bổ ngay
                        </button>
                      </div>
                    </div>
                  ))}
                  {result.reconciliation.missingRevenueRecords.length === 0 && (
                    <p className="text-xs font-bold text-slate-400 text-center py-8">Tuyệt vời! Tất cả giao dịch đã được phân bổ khớp số.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 text-orange-600">
                  <FaExclamationTriangle /> Doanh thu không rõ nguồn gốc ({result.reconciliation.orphanRevenueRecords.length})
                </h4>
                <p className="text-3xs font-semibold text-slate-500">Các khoản doanh thu được phân bổ nhưng không đối sánh được với giao dịch thanh toán nào của khách hàng.</p>
                <div className="overflow-y-auto max-h-60 space-y-2 pr-1">
                  {result.reconciliation.orphanRevenueRecords.map((id) => (
                    <div key={id} className="p-2.5 bg-slate-50 rounded-xl text-3xs font-mono text-slate-700 font-bold border border-slate-100 select-all">
                      {id}
                    </div>
                  ))}
                  {result.reconciliation.orphanRevenueRecords.length === 0 && (
                    <p className="text-xs font-bold text-slate-400 text-center py-8">Không phát hiện doanh thu mồ côi.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {result && resultType === 'report' && result.report && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng giao dịch</p>
                <p className="mt-1 text-xl font-black text-slate-900">{result.report.count}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng doanh thu gộp</p>
                <p className="mt-1 text-xl font-black text-slate-950">{money(result.report.grossAmount)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phí Vexere thu</p>
                <p className="mt-1 text-xl font-black text-emerald-600">{money(result.report.platformFee)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng chia cho Nhà xe</p>
                <p className="mt-1 text-xl font-black text-blue-600">{money(result.report.carrierAmount)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <h4 className="font-black text-slate-900 text-sm">Cơ cấu doanh thu theo nguồn thanh toán</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Hình thức thanh toán</th>
                      <th className="px-4 py-2.5 text-right">Doanh thu gộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(result.report.bySource || {}).map(([source, amt]) => (
                      <tr key={source} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-700 capitalize">
                          {source === 'online_split' ? 'Phân bổ thanh toán Online' : source === 'cod' ? 'Thanh toán tại quầy COD' : source}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{money(amt)}</td>
                      </tr>
                    ))}
                    {Object.keys(result.report.bySource || {}).length === 0 && (
                      <tr>
                        <td colSpan="2" className="px-4 py-6 text-center font-bold text-slate-400">Không có dữ liệu cơ cấu doanh thu.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

import { useState } from 'react';
import { FaRedo } from 'react-icons/fa';
import subscriptionApi from '../services/subscriptionApi.js';

export default function SubscriptionRenew({ currentSubscription, onDone }) {
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const subscriptionId = currentSubscription?.subscriptionId || '';

  const submit = async (event) => {
    event.preventDefault();
    if (!subscriptionId) {
      setMessage('Bạn cần có gói đang hoạt động trước khi gia hạn.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const result = await subscriptionApi.renew(subscriptionId, { durationMonths: Number(durationMonths), paymentMethod });
      setMessage('Gia hạn gói dịch vụ thành công.');
      onDone?.(result.subscription);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-slate-950">Gia hạn gói hiện tại</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {currentSubscription
            ? `Gói ${currentSubscription.displayName} sẽ được gia hạn theo lựa chọn bên dưới.`
            : 'Chưa có gói đang hoạt động để gia hạn.'}
        </p>
      </div>
      {currentSubscription && (
        <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">
          <span className="font-black text-slate-800">Mã gói:</span> {subscriptionId}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Số tháng gia hạn</span>
          <input
            type="number"
            min="1"
            value={durationMonths}
            onChange={(event) => setDurationMonths(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Phương thức thanh toán</span>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          >
            <option value="bank_transfer">Chuyển khoản ngân hàng</option>
            <option value="wallet">Ví điện tử</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={loading || !subscriptionId}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <FaRedo />
        {loading ? 'Đang gia hạn...' : 'Gia hạn'}
      </button>
      {message && <div className="text-sm font-bold text-slate-600">{message}</div>}
    </form>
  );
}

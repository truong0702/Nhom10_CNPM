import { useState } from 'react';
import { FaBan } from 'react-icons/fa';
import subscriptionApi from '../services/subscriptionApi.js';

export default function SubscriptionCancel({ currentSubscription, onDone }) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const subscriptionId = currentSubscription?.subscriptionId || '';

  const submit = async (event) => {
    event.preventDefault();
    if (!subscriptionId) {
      setMessage('Bạn cần có gói đang hoạt động trước khi hủy.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const result = await subscriptionApi.cancel(subscriptionId, { reason });
      setMessage('Hủy gói dịch vụ thành công.');
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
        <h2 className="text-xl font-black text-slate-950">Hủy gói dịch vụ</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {currentSubscription
            ? `Hủy gói ${currentSubscription.displayName} nếu nhà xe không còn nhu cầu sử dụng.`
            : 'Chưa có gói đang hoạt động để hủy.'}
        </p>
      </div>
      {currentSubscription && (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          Mã gói sẽ hủy: <span className="font-black">{subscriptionId}</span>
        </div>
      )}
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Lý do</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows="3"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        />
      </label>
      <label className="flex items-start gap-2 text-sm font-bold text-slate-600">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1"
          disabled={!subscriptionId}
        />
        Tôi xác nhận muốn hủy gói dịch vụ hiện tại.
      </label>
      <button
        type="submit"
        disabled={loading || !subscriptionId || !confirmed}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        <FaBan />
        {loading ? 'Đang hủy...' : 'Hủy gói'}
      </button>
      {message && <div className="text-sm font-bold text-slate-600">{message}</div>}
    </form>
  );
}

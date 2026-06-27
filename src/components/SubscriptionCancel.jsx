import { useState } from 'react';
import { FaBan } from 'react-icons/fa';
import subscriptionApi from '../services/subscriptionApi.js';

export default function SubscriptionCancel({ onDone }) {
  const [id, setId] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await subscriptionApi.cancel(id, { reason });
      setMessage('Subscription cancelled successfully.');
      onDone?.(result.subscription);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Cancel subscription</h2>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Subscription ID</span>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Reason</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows="3"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        <FaBan />
        {loading ? 'Cancelling...' : 'Cancel'}
      </button>
      {message && <div className="text-sm font-bold text-slate-600">{message}</div>}
    </form>
  );
}

import { useState } from 'react';
import { FaRedo } from 'react-icons/fa';
import subscriptionApi from '../services/subscriptionApi.js';

export default function SubscriptionRenew({ onDone }) {
  const [id, setId] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await subscriptionApi.renew(id, { durationMonths: Number(durationMonths), paymentMethod });
      setMessage('Subscription renewed successfully.');
      onDone?.(result.subscription);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black text-slate-950">Renew subscription</h2>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Subscription ID</span>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Duration months</span>
          <input
            type="number"
            min="1"
            value={durationMonths}
            onChange={(event) => setDurationMonths(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">Payment method</span>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="wallet">Wallet</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
      >
        <FaRedo />
        {loading ? 'Renewing...' : 'Renew'}
      </button>
      {message && <div className="text-sm font-bold text-slate-600">{message}</div>}
    </form>
  );
}

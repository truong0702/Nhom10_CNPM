import { useState } from 'react';
import { FaCheck, FaCreditCard } from 'react-icons/fa';
import subscriptionApi from '../services/subscriptionApi.js';

const plans = [
  { planCode: 'basic', planName: 'Basic', price: 99000, durationMonths: 1 },
  { planCode: 'pro', planName: 'Pro', price: 249000, durationMonths: 3 },
  { planCode: 'enterprise', planName: 'Enterprise', price: 799000, durationMonths: 12 },
];

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

export default function SubscriptionForm({ onDone }) {
  const [planCode, setPlanCode] = useState('basic');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedPlan = plans.find((plan) => plan.planCode === planCode);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await subscriptionApi.register({ ...selectedPlan, paymentMethod });
      setMessage('Subscription registered successfully.');
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
        <h2 className="text-xl font-black text-slate-950">Register subscription</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Choose a service package and payment method.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <label
            key={plan.planCode}
            className={`cursor-pointer rounded-xl border p-4 ${
              planCode === plan.planCode ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'
            }`}
          >
            <input
              className="sr-only"
              type="radio"
              name="planCode"
              value={plan.planCode}
              checked={planCode === plan.planCode}
              onChange={(event) => setPlanCode(event.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-950">{plan.planName}</span>
              {planCode === plan.planCode && <FaCheck className="text-red-600" />}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">{money(plan.price)}</div>
            <div className="text-xs font-bold uppercase text-slate-400">{plan.durationMonths} month(s)</div>
          </label>
        ))}
      </div>

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

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"
      >
        <FaCreditCard />
        {loading ? 'Submitting...' : 'Register'}
      </button>
      {message && <div className="text-sm font-bold text-slate-600">{message}</div>}
    </form>
  );
}

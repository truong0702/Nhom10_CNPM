import { useEffect, useState } from 'react';
import SubscriptionCancel from '../components/SubscriptionCancel.jsx';
import SubscriptionForm from '../components/SubscriptionForm.jsx';
import SubscriptionRenew from '../components/SubscriptionRenew.jsx';
import subscriptionApi from '../services/subscriptionApi.js';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

export default function SubscriptionPage() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      setError('');
      const result = await subscriptionApi.paymentHistory();
      setPayments(result.payments || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section>
        <div className="text-sm font-black uppercase tracking-wide text-red-600">Subscriptions</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Service package management</h1>
      </section>

      <SubscriptionForm onDone={loadHistory} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SubscriptionRenew onDone={loadHistory} />
        <SubscriptionCancel onDone={loadHistory} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Payment history</h2>
          <button
            type="button"
            onClick={loadHistory}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
        {error && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Subscription</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Paid at</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={`${payment.subscriptionId}-${payment.sequence}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-700">{payment.subscriptionId}</td>
                  <td className="px-3 py-2">{payment.planName}</td>
                  <td className="px-3 py-2">{payment.action}</td>
                  <td className="px-3 py-2">{money(payment.amount)}</td>
                  <td className="px-3 py-2">{payment.method}</td>
                  <td className="px-3 py-2">{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-3 py-8 text-center font-bold text-slate-400">
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

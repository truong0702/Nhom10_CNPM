import { useState } from 'react';
import { FaCalculator, FaChartLine, FaExchangeAlt, FaMoneyBillWave, FaSearchDollar } from 'react-icons/fa';
import financeAdminApi from '../services/financeAdminApi.js';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

function Field({ label, children }) {
  return (
    <label className="block">
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
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const run = async (action) => {
    setMessage('');
    try {
      const data = await action();
      setResult(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="text-sm font-black uppercase tracking-wide text-red-600">Admin finance</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Revenue operations</h1>
      </section>

      {message && <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() => financeAdminApi.calculateFee(feeForm));
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaCalculator /> Fee calculation
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Amount">
              <input className={inputClass} type="number" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} />
            </Field>
            <Field label="Percent">
              <input className={inputClass} type="number" value={feeForm.percent} onChange={(e) => setFeeForm({ ...feeForm, percent: e.target.value })} />
            </Field>
            <Field label="Fixed fee">
              <input className={inputClass} type="number" value={feeForm.fixedFee} onChange={(e) => setFeeForm({ ...feeForm, fixedFee: e.target.value })} />
            </Field>
            <Field label="Tax percent">
              <input className={inputClass} type="number" value={feeForm.taxPercent} onChange={(e) => setFeeForm({ ...feeForm, taxPercent: e.target.value })} />
            </Field>
          </div>
          <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">Calculate</button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() => financeAdminApi.splitPayment(splitForm));
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaExchangeAlt /> Online payment split
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Payment ID">
              <input className={inputClass} value={splitForm.paymentId} onChange={(e) => setSplitForm({ ...splitForm, paymentId: e.target.value })} />
            </Field>
            <Field label="Amount">
              <input className={inputClass} type="number" value={splitForm.amount} onChange={(e) => setSplitForm({ ...splitForm, amount: e.target.value })} />
            </Field>
            <Field label="Platform percent">
              <input className={inputClass} type="number" value={splitForm.platformPercent} onChange={(e) => setSplitForm({ ...splitForm, platformPercent: e.target.value })} />
            </Field>
          </div>
          <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Split</button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            run(() => financeAdminApi.recordCod(codForm));
          }}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaMoneyBillWave /> COD revenue
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Booking ID">
              <input className={inputClass} value={codForm.bookingId} onChange={(e) => setCodForm({ ...codForm, bookingId: e.target.value })} />
            </Field>
            <Field label="Amount">
              <input className={inputClass} type="number" value={codForm.amount} onChange={(e) => setCodForm({ ...codForm, amount: e.target.value })} />
            </Field>
            <Field label="Collected by">
              <input className={inputClass} value={codForm.collectedBy} onChange={(e) => setCodForm({ ...codForm, collectedBy: e.target.value })} />
            </Field>
          </div>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Record COD</button>
        </form>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FaSearchDollar /> Reconciliation and report
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="From">
              <input className={inputClass} type="date" value={fromTo.from} onChange={(e) => setFromTo({ ...fromTo, from: e.target.value })} />
            </Field>
            <Field label="To">
              <input className={inputClass} type="date" value={fromTo.to} onChange={(e) => setFromTo({ ...fromTo, to: e.target.value })} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => run(() => financeAdminApi.reconciliation(fromTo))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700">
              Reconcile
            </button>
            <button type="button" onClick={() => run(() => financeAdminApi.revenueReport(fromTo))} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
              <FaChartLine /> Revenue report
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Result</h2>
          {result?.fee && <span className="text-sm font-black text-red-600">{money(result.fee.totalFee)}</span>}
        </div>
        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold text-slate-50">
          {result ? JSON.stringify(result, null, 2) : 'No result yet.'}
        </pre>
      </section>
    </div>
  );
}

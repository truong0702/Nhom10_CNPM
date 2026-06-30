import { useEffect, useMemo, useState } from 'react';
import SubscriptionCancel from '../components/SubscriptionCancel.jsx';
import SubscriptionForm, { plans } from '../components/SubscriptionForm.jsx';
import SubscriptionRenew from '../components/SubscriptionRenew.jsx';
import subscriptionApi from '../services/subscriptionApi.js';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;
const planLabels = {
  Basic: 'Cơ bản',
  Pro: 'Chuyên nghiệp',
  Enterprise: 'Doanh nghiệp',
};

const actionLabels = {
  register: 'Đăng ký',
  renew: 'Gia hạn',
  cancel: 'Hủy',
};

const methodLabels = {
  bank_transfer: 'Chuyển khoản ngân hàng',
  wallet: 'Ví điện tử',
};

const statusLabels = {
  active: 'Đang hoạt động',
  cancelled: 'Đã hủy',
  expired: 'Đã hết hạn',
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + Number(months || 1));
  return next;
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-');

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

  const currentSubscription = useMemo(() => {
    const latestBySubscription = new Map();

    payments.forEach((payment) => {
      const current = latestBySubscription.get(payment.subscriptionId);
      const paidAt = payment.paidAt ? new Date(payment.paidAt).getTime() : 0;
      const currentPaidAt = current?.paidAt ? new Date(current.paidAt).getTime() : 0;

      if (!current || paidAt >= currentPaidAt) {
        latestBySubscription.set(payment.subscriptionId, payment);
      }
    });

    const latestActive = Array.from(latestBySubscription.values())
      .filter((payment) => payment.status === 'active')
      .sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))[0];

    if (!latestActive) return null;

    const plan = plans.find((item) => item.planCode === latestActive.planCode);
    const startDate = latestActive.paidAt ? new Date(latestActive.paidAt) : null;
    const endDate = startDate ? addMonths(startDate, plan?.durationMonths || 1) : null;
    const daysLeft = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null;

    return {
      ...latestActive,
      displayName: planLabels[latestActive.planName] || plan?.displayName || latestActive.planName,
      price: plan?.price || latestActive.amount,
      durationMonths: plan?.durationMonths || 1,
      startDate,
      endDate,
      daysLeft,
    };
  }, [payments]);

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section>
        <div className="text-sm font-black uppercase tracking-wide text-red-600">Gói dịch vụ</div>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Quản lý gói dịch vụ</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-wide text-slate-400">Gói hiện tại</div>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {currentSubscription ? currentSubscription.displayName : 'Chưa có gói hoạt động'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
                {currentSubscription
                  ? 'Hệ thống tự lấy mã gói từ lịch sử thanh toán, nhà xe có thể gia hạn hoặc hủy trực tiếp.'
                  : 'Chọn một gói dịch vụ bên dưới để bắt đầu sử dụng các công cụ vận hành dành cho nhà xe.'}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-black ${
                currentSubscription ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {currentSubscription ? statusLabels[currentSubscription.status] : 'Chưa đăng ký'}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-black uppercase text-slate-400">Mã gói</div>
              <div className="mt-1 truncate text-sm font-black text-slate-800">
                {currentSubscription?.subscriptionId || '-'}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-black uppercase text-slate-400">Bắt đầu</div>
              <div className="mt-1 text-sm font-black text-slate-800">{formatDate(currentSubscription?.startDate)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-black uppercase text-slate-400">Dự kiến hết hạn</div>
              <div className="mt-1 text-sm font-black text-slate-800">{formatDate(currentSubscription?.endDate)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-black uppercase text-slate-400">Còn lại</div>
              <div className="mt-1 text-sm font-black text-slate-800">
                {currentSubscription?.daysLeft !== null && currentSubscription?.daysLeft !== undefined
                  ? `${currentSubscription.daysLeft} ngày`
                  : '-'}
              </div>
            </div>
          </div>

          {typeof currentSubscription?.daysLeft === 'number' && currentSubscription.daysLeft <= 7 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
              Gói dịch vụ sắp hết hạn. Hãy gia hạn để không gián đoạn việc đăng chuyến và quản lý vé.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-black uppercase tracking-wide text-slate-400">Tổng quan thanh toán</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{money(totalPaid)}</div>
          <div className="mt-1 text-sm font-semibold text-slate-500">Tổng chi phí gói dịch vụ đã ghi nhận</div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-red-50 p-3">
              <div className="text-xs font-black uppercase text-red-400">Giao dịch</div>
              <div className="mt-1 text-xl font-black text-red-700">{payments.length}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-black uppercase text-slate-400">Phương thức</div>
              <div className="mt-1 text-sm font-black text-slate-800">
                {currentSubscription ? methodLabels[currentSubscription.method] || currentSubscription.method : '-'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SubscriptionForm currentSubscription={currentSubscription} onDone={loadHistory} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SubscriptionRenew currentSubscription={currentSubscription} onDone={loadHistory} />
        <SubscriptionCancel currentSubscription={currentSubscription} onDone={loadHistory} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">So sánh gói dịch vụ</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Gói</th>
                <th className="px-3 py-2">Thời hạn</th>
                <th className="px-3 py-2">Chi phí</th>
                <th className="px-3 py-2">Quy mô vận hành</th>
                <th className="px-3 py-2">Tính năng nổi bật</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.planCode} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-black text-slate-900">{plan.displayName}</td>
                  <td className="px-3 py-3">{plan.durationMonths} tháng</td>
                  <td className="px-3 py-3 font-bold">{money(plan.price)}</td>
                  <td className="px-3 py-3">{plan.limit}</td>
                  <td className="px-3 py-3">{plan.features.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-950">Lịch sử thanh toán</h2>
          <button
            type="button"
            onClick={loadHistory}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>
        {error && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Mã gói</th>
                <th className="px-3 py-2">Gói</th>
                <th className="px-3 py-2">Thao tác</th>
                <th className="px-3 py-2">Số tiền</th>
                <th className="px-3 py-2">Phương thức</th>
                <th className="px-3 py-2">Thời gian thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={`${payment.subscriptionId}-${payment.sequence}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-700">{payment.subscriptionId}</td>
                  <td className="px-3 py-2">{planLabels[payment.planName] || payment.planName}</td>
                  <td className="px-3 py-2">{actionLabels[payment.action] || payment.action}</td>
                  <td className="px-3 py-2">{money(payment.amount)}</td>
                  <td className="px-3 py-2">{methodLabels[payment.method] || payment.method}</td>
                  <td className="px-3 py-2">{payment.paidAt ? new Date(payment.paidAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-3 py-8 text-center font-bold text-slate-400">
                    Chưa có lịch sử thanh toán.
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

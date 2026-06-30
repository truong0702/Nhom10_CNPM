import { useState } from 'react';
import { FaCheck, FaCreditCard, FaChartLine, FaHeadset, FaRoute } from 'react-icons/fa';
import subscriptionApi from '../services/subscriptionApi.js';

export const plans = [
  {
    planCode: 'basic',
    planName: 'Basic',
    displayName: 'Cơ bản',
    price: 99000,
    durationMonths: 1,
    badge: 'Khởi đầu',
    summary: 'Phù hợp nhà xe mới vận hành trên hệ thống.',
    limit: 'Tối đa 10 xe/tháng',
    features: ['Đăng và quản lý chuyến', 'Theo dõi vé đã đặt', 'Hỗ trợ qua email'],
  },
  {
    planCode: 'pro',
    planName: 'Pro',
    displayName: 'Chuyên nghiệp',
    price: 249000,
    durationMonths: 3,
    badge: 'Phổ biến',
    summary: 'Tối ưu cho nhà xe có lịch chạy ổn định.',
    limit: 'Tối đa 50 xe/tháng',
    features: ['Tất cả tính năng Cơ bản', 'Thống kê doanh thu', 'Ưu tiên hiển thị chuyến'],
  },
  {
    planCode: 'enterprise',
    planName: 'Enterprise',
    displayName: 'Doanh nghiệp',
    price: 799000,
    durationMonths: 12,
    badge: 'Quy mô lớn',
    summary: 'Dành cho đơn vị có nhiều tuyến và nhiều xe.',
    limit: 'Không giới hạn xe',
    features: ['Tất cả tính năng Chuyên nghiệp', 'Báo cáo nâng cao', 'Hỗ trợ ưu tiên'],
  },
];

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

export default function SubscriptionForm({ currentSubscription, onDone }) {
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
      const { planCode, planName, price, durationMonths } = selectedPlan;
      const result = await subscriptionApi.register({ planCode, planName, price, durationMonths, paymentMethod });
      setMessage('Đăng ký gói dịch vụ thành công. Lịch sử thanh toán đã được cập nhật.');
      onDone?.(result.subscription);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">Chọn gói dịch vụ</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Chọn gói phù hợp với quy mô vận hành của nhà xe.
          </p>
        </div>
        {currentSubscription && (
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            Đang dùng: {currentSubscription.displayName}
          </div>
        )}
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
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                {plan.badge}
              </span>
              {planCode === plan.planCode && <FaCheck className="text-red-600" />}
            </div>
            <div className="mt-4 text-lg font-black text-slate-950">{plan.displayName}</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">{plan.summary}</div>
            <div className="mt-4 text-xl font-black text-slate-950">{money(plan.price)}</div>
            <div className="text-xs font-bold uppercase text-slate-400">{plan.durationMonths} tháng sử dụng</div>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700">
              <FaRoute className="text-red-500" />
              {plan.limit}
            </div>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <FaCheck className="mt-1 shrink-0 text-red-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
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

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"
        >
          <FaCreditCard />
          {loading ? 'Đang xử lý...' : currentSubscription ? 'Chọn gói này' : 'Đăng ký gói'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 md:grid-cols-2">
        <div className="flex items-center gap-2">
          <FaChartLine className="text-red-500" />
          Có thể thay đổi gói khi nhu cầu vận hành tăng.
        </div>
        <div className="flex items-center gap-2">
          <FaHeadset className="text-red-500" />
          Thanh toán xong sẽ được ghi vào lịch sử để đối soát.
        </div>
      </div>
      {message && <div className="text-sm font-bold text-slate-600">{message}</div>}
    </form>
  );
}

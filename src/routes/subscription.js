import AdminFinancePage from '../pages/AdminFinancePage.jsx';
import SubscriptionPage from '../pages/SubscriptionPage.jsx';

export const subscriptionRoutes = [
  {
    path: '/subscriptions',
    element: SubscriptionPage,
  },
  {
    path: '/admin/finance',
    element: AdminFinancePage,
  },
];

export default subscriptionRoutes;

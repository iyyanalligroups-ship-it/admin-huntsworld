import React from 'react';
import { Route } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import MerchantLayout from './MerchantLayout';
import Products from './pages/products/Products';
import Branches from './pages/branches/SubDealerPage';
import SEARequirement from './pages/sea-requirement/SEARequirement';
import Reviews from './pages/others/Reviews';
import Queries from './pages/others/Queries';
import Wallet from './pages/wallet/Wallet';
import Settings from './pages/settings/Settings';
import UpgradePlanPage from './pages/plans/subcription/UpgradePlanPage';
import PlanSubscription from './pages/plans/Subscription';
import PlanBanner from './pages/plans/Banner';
import PlanTrending from './pages/plans/Trending';
import PlanEbook from './pages/plans/Ebook';
import TrustSealSubscription from './pages/plans/trust-seal/TrustSealSubscription';
import ChatWindow from '../admin/pages/chat/components/ChatWindow';
import ChatPage from './pages/chat/pages/ChatPage';

const MerchantRoute = (
  <Route path="/merchant" element={<MerchantLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="products" element={<Products />} />
    <Route path="branches" element={<Branches />} />
    <Route path="sea-requirement" element={<SEARequirement />} />
    <Route path="reviews" element={<Reviews />} />
    <Route path="queries" element={<Queries />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="settings" element={<Settings />} />
    <Route path="chat" element={<ChatPage />} />

    {/* Plans */}
    <Route path="plans/subscription" element={<PlanSubscription />} />
    <Route path="plans/upgrade-plan" element={<UpgradePlanPage />} />
    <Route path="plans/banner" element={<PlanBanner />} />
    <Route path="plans/trending" element={<PlanTrending />} />
    <Route path="plans/e-book" element={<PlanEbook />} />
    <Route path="plans/trust-seal/:requestId?" element={<TrustSealSubscription />} />
  </Route>
);

export default MerchantRoute;

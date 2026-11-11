/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { PosHeader } from './components/PosHeader';
import { PosMain } from './components/PosMain';
import { MenuManagement } from './components/MenuManagement';
import { TransactionHistory } from './components/TransactionHistory';
import { SalesDashboard } from './components/SalesDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';

const MainAppLayout: React.FC = () => {
  const { currentUser, activeTab } = useApp();

  // If no user is authenticated, show the login screen first
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f0] text-slate-900 font-sans antialiased">
      {/* Top Bar following contract */}
      <PosHeader />

      {/* Main Workspace Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' && <PosMain />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'history' && <TransactionHistory />}
        {activeTab === 'dashboard' && <SalesDashboard />}
        {activeTab === 'owner' && <OwnerDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}

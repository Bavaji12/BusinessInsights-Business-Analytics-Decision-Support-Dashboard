import React, { useState } from 'react';
import { FilterProvider } from './context/FilterContext';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import SalesAnalyticsPage from './pages/SalesAnalyticsPage';
import CustomerAnalyticsPage from './pages/CustomerAnalyticsPage';
import BusinessInsightsPage from './pages/BusinessInsightsPage';
import CustomerFeedbackPage from './pages/CustomerFeedbackPage';
import DataManagementPage from './pages/DataManagementPage';

const TAB_METADATA = {
  dashboard: {
    title: 'Executive Business Dashboard',
    subtitle: 'High-level KPI performance metrics, revenue trajectories, and geographic distributions',
  },
  sales: {
    title: 'Sales & Transaction Analytics',
    subtitle: 'Deep-dive order transactions, category performance, and product sales velocity',
  },
  customers: {
    title: 'Customer Analytics & Segmentation',
    subtitle: 'Customer lifetime spend, cohort segmentation, and purchasing frequency',
  },
  insights: {
    title: 'Business Insights & Decision Support',
    subtitle: 'Calculated business bottlenecks, revenue contraction warnings, and actionable recommendations',
  },
  feedback: {
    title: 'Customer Feedback & CSAT Intelligence',
    subtitle: 'Customer sentiment tracking, complaint drivers, and satisfaction score distributions',
  },
  data: {
    title: 'Data Management & CSV Import/Export',
    subtitle: 'Upload CSV datasets with strict validation, preview records, and export reports',
  },
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentMeta = TAB_METADATA[activeTab] || TAB_METADATA.dashboard;

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTo={setActiveTab} />;
      case 'sales':
        return <SalesAnalyticsPage />;
      case 'customers':
        return <CustomerAnalyticsPage />;
      case 'insights':
        return <BusinessInsightsPage />;
      case 'feedback':
        return <CustomerFeedbackPage />;
      case 'data':
        return <DataManagementPage />;
      default:
        return <DashboardPage onNavigateTo={setActiveTab} />;
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      title={currentMeta.title}
      subtitle={currentMeta.subtitle}
    >
      {renderActivePage()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <FilterProvider>
      <AppContent />
    </FilterProvider>
  );
}

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GrowthTacticsPanel } from './components/GrowthTacticsPanel';

function App() {
  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] overflow-hidden relative">
      <Sidebar />
      <Dashboard />
      <GrowthTacticsPanel />
    </div>
  );
}

export default App;
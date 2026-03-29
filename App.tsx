import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GrowthTacticsPanel } from './components/GrowthTacticsPanel';
import { useStore } from './store';

function App() {
  const { user, setUser, loadUserData } = useStore();

  useEffect(() => {
    // Bypass auth and set a guest user
    setUser({ 
      uid: 'guest', 
      email: 'guest@example.com', 
      photoURL: null,
      loading: false 
    });
    // We don't call loadUserData('guest') to avoid firestore permission issues,
    // or we can just let it use the default local state.
  }, [setUser]);

  if (user.loading) {
     // Initial Load
     return (
       <div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7]">
         <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
         </div>
       </div>
     );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] overflow-hidden relative">
      <Sidebar />
      <Dashboard />
      <GrowthTacticsPanel />
    </div>
  );
}

export default App;
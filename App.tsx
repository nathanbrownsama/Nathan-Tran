import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GrowthTacticsPanel } from './components/GrowthTacticsPanel';
import { Auth } from './components/Auth';
import { useStore } from './store';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const { user, setUser, loadUserData } = useStore();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ 
          uid: firebaseUser.uid, 
          email: firebaseUser.email, 
          photoURL: firebaseUser.photoURL,
          loading: true // Set loading while we fetch Firestore data
        });
        loadUserData(firebaseUser.uid);
      } else {
        setUser({ uid: null, email: null, photoURL: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, [setUser, loadUserData]);

  if (user.loading && !user.uid) {
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

  // Not logged in and not manually set to demo mode (which sets a fake uid)
  if (!user.uid) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] overflow-hidden relative">
      <Sidebar />
      {user.loading ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="text-gray-400 font-medium animate-pulse">Syncing data...</div>
          </div>
      ) : (
          <Dashboard />
      )}
      <GrowthTacticsPanel />
    </div>
  );
}

export default App;
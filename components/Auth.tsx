import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useStore } from '../store';

export const Auth: React.FC = () => {
  const { user } = useStore();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Check console for details.");
    }
  };

  const handleDemoMode = () => {
    // We just set a fake local ID to bypass the login screen without auth
    useStore.getState().setUser({ uid: 'demo-user', loading: false });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg">
             <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SubCalculator Pro</h1>
          <p className="text-gray-500 mb-8">
            Decision-grade modeling for Subscription Apps & SaaS. Sign in to save your scenarios.
          </p>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm mb-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-400 font-medium">Or</span>
            </div>
          </div>

          <button 
            onClick={handleDemoMode}
            className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            Try Demo Mode
          </button>
          
          <p className="text-xs text-gray-400 mt-6">
            By signing in, you agree to store your calculation data on Google Cloud Platform.
          </p>
        </div>
      </div>
    </div>
  );
};
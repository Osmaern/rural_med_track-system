import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { Subscription, User } from '../types';
import { ShieldCheck, Smartphone, RefreshCcw, LogOut, RefreshCw, CheckCircle, XCircle, KeyRound, User as UserIcon } from 'lucide-react';

export const Settings: React.FC<{ 
  subscription: Subscription; 
  onUpdate: () => void;
  onReset: () => void;
  onSync: () => Promise<void>;
  onLogout: () => void;
  isSyncing: boolean;
  user?: User | null;
}> = ({ subscription, onUpdate, onReset, onSync, onLogout, isSyncing, user }) => {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [inputError, setInputError] = useState(false);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleManualRenew = async () => {
    if (!code.trim()) return;

    setVerifying(true);
    setInputError(false);

    // Simulate network/validation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (code === '2005') {
      const newSub: Subscription = {
        isActive: true,
        expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        lastPaymentMethod: 'MoMo'
      };
      StorageService.updateSubscription(newSub);
      onUpdate();
      showNotification("Subscription Activated for 30 Days!", 'success');
      setCode('');
    } else {
      setInputError(true);
      showNotification("Invalid Admin Code. Try '2005'", 'error');
    }
    setVerifying(false);
  };
  
  const handleSyncClick = async () => {
    await onSync();
    showNotification("Data synced with server successfully.", 'success');
  };

  const handleResetClick = () => {
    if (confirm("WARNING: This will delete all inventory and logs. Reset to demo data?")) {
      onReset();
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50 animate-fade-in ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-bold">{notification.msg}</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Smartphone className="text-primary" size={20} />
          Subscription Status
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Status</span>
            <span className={subscription.isActive ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
              {subscription.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expires</span>
            <span className="font-medium text-gray-800">{new Date(subscription.expiryDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Renew via MoMo</h3>
          <p className="text-xs text-gray-500 mb-3">
            1. Send 50 GHS to <strong>055-123-4567</strong> (RuralMed Ltd)<br/>
            2. Enter activation code provided by Admin below.
          </p>
          <div className="flex gap-2">
            <div className={`flex-1 flex items-center border rounded-lg px-3 py-2 bg-white transition-colors ${inputError ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200 focus-within:ring-2 focus-within:ring-primary/20'}`}>
              <KeyRound size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                className="w-full text-sm outline-none bg-transparent"
                placeholder="Admin Code (Try 2005)"
                value={code}
                disabled={verifying}
                onChange={(e) => {
                  setCode(e.target.value);
                  setInputError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleManualRenew()}
              />
            </div>
            <button 
              onClick={handleManualRenew}
              disabled={verifying || !code}
              className={`bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${verifying || !code ? 'opacity-70 cursor-not-allowed' : 'hover:bg-secondary active:scale-95'}`}
            >
              {verifying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Verifying...
                </>
              ) : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
           <ShieldCheck size={20} className="text-gray-600" />
           Admin Controls
        </h2>
        <div className="space-y-3">
          <button 
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing with Server...' : 'Sync Data Now'}</span>
            </div>
          </button>

          <button 
            onClick={handleResetClick}
            className="w-full flex items-center justify-between p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <RefreshCcw size={16} />
              <span>Reset Demo Data</span>
            </div>
          </button>
          
           <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between p-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors active:scale-[0.99] border border-gray-200"
          >
            <div className="flex items-center gap-2">
              <LogOut size={16} />
              <span>Logout {user ? user.name : 'Account'}</span>
            </div>
            {user && <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-100">{user.role}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
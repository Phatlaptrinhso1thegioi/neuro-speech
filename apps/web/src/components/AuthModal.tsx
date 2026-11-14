import React, { useState } from 'react';
import { Shield, Key, User, Lock, X, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: { username: string; role: string; full_name: string }) => void;
  currentUser: { username: string; role: string; full_name: string } | null;
  onLogout: () => void;
}

const DEMO_ACCOUNTS = [
  { role: 'caregiver', username: 'caregiver', password: 'Caregiver@12345', label: 'Caregiver (Clinical)' },
  { role: 'researcher', username: 'researcher', password: 'Researcher@12345', label: 'Researcher (BCI Lead)' },
  { role: 'admin', username: 'admin', password: 'Admin@12345', label: 'Administrator (Full Access)' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [username, setUsername] = useState('caregiver');
  const [password, setPassword] = useState('Caregiver@12345');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (u: string, p: string) => {
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await resp.json();
      if (resp.ok) {
        onLoginSuccess(data.access_token, {
          username: data.username,
          role: data.role,
          full_name: data.full_name,
        });
        onClose();
      } else {
        setError(data.detail || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Cannot reach API backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neuro-panel border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h2 className="text-lg font-bold text-gray-100">
            {currentUser ? 'User Profile & Role' : 'Offline Authentication (JWT)'}
          </h2>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="bg-neuro-bg border border-gray-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Logged in as:</span>
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-base font-bold text-gray-100">{currentUser.full_name}</div>
              <div className="text-xs font-mono text-gray-400">@{currentUser.username}</div>
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 rounded-lg text-xs font-bold transition-colors"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Select a pre-seeded demo account or enter credentials below.
            </p>

            {/* One-click demo account buttons */}
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword(acc.password);
                    handleLogin(acc.username, acc.password);
                  }}
                  className="w-full p-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 flex items-center justify-between text-xs text-gray-200 transition-all text-left"
                >
                  <div>
                    <span className="font-bold text-cyan-300">{acc.label}</span>
                    <span className="text-gray-500 font-mono block text-[10px]">
                      User: {acc.username} | Pass: {acc.password}
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>

            {error && (
              <div className="text-xs font-mono text-red-400 bg-red-950/40 p-2.5 rounded border border-red-800">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

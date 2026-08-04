import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// requireText: if set, the confirm button stays disabled until the user types this exact string —
// extra friction for high-risk actions (e.g. a manager overriding a normal restriction).
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, requireText, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);

  if (!open) return null;
  const locked = requireText && typed !== requireText;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6 space-y-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{title || 'Are you sure?'}</h2>
          {message && <p className="text-sm text-gray-500">{message}</p>}
          {requireText && (
            <input
              type="text"
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={`Type "${requireText}" to confirm`}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={locked}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

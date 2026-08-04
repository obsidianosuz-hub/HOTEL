import { useState, useCallback, useRef } from 'react';

// Promise-based replacement for window.confirm() — native browser dialogs get
// silently auto-dismissed in some browser/extension setups, which made buttons
// look "broken" even though the click handler ran correctly.
export default function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', confirmLabel: 'Confirm', danger: false, requireText: undefined });
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : (options || {});
    setState({
      open: true,
      title: opts.title || 'Are you sure?',
      message: opts.message || '',
      confirmLabel: opts.confirmLabel || 'Confirm',
      danger: !!opts.danger,
      requireText: opts.requireText
    });
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    if (resolver.current) resolver.current(true);
  }, []);

  const handleCancel = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    if (resolver.current) resolver.current(false);
  }, []);

  return { confirm, dialogProps: { ...state, onConfirm: handleConfirm, onCancel: handleCancel } };
}

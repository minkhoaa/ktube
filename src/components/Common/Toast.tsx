import { useEffect } from 'preact/hooks';
import './Toast.css';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  durationMs?: number;
}

export function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  durationMs = 5000
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onClose]);

  const handleAction = () => {
    if (onAction) onAction();
    onClose();
  };

  return (
    <div className="puretube-toast" role="alert">
      <span className="toast-message">{message}</span>
      <div className="toast-actions">
        {actionLabel && (
          <button className="toast-action-btn" onClick={handleAction}>
            {actionLabel}
          </button>
        )}
        <button className="toast-close-btn" onClick={onClose} title="Đóng">
          ×
        </button>
      </div>
    </div>
  );
}

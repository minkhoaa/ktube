import { useState, useEffect, useRef } from 'preact/hooks';
import { subscribePageLoading } from '../../services/store';
import './TopProgressBar.css';

export function TopProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<any[]>([]);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  useEffect(() => {
    return subscribePageLoading((isLoading) => {
      clearTimers();

      if (isLoading) {
        setVisible(true);
        setProgress(20);

        timersRef.current.push(
          setTimeout(() => {
            setProgress(55);
          }, 80)
        );

        timersRef.current.push(
          setTimeout(() => {
            setProgress(85);
          }, 240)
        );
      } else {
        // Complete loading
        setProgress(100);
        timersRef.current.push(
          setTimeout(() => {
            setVisible(false);
            setProgress(0);
          }, 180)
        );
      }
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="top-progress-bar-container" role="progressbar" aria-valuenow={progress}>
      <div
        className="top-progress-bar-fill"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1
        }}
      >
        <div className="top-progress-bar-glow" />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

const ROUTES = [
  { label: 'Games', path: '/games' },
  { label: 'Standings', path: '/standings' },
  { label: 'Players', path: '/players' },
];

export function CmdK() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const ci = ROUTES.findIndex((r) => locationRef.current.pathname.startsWith(r.path));
        setIdx(ci === -1 ? 0 : ci);
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => (i + 1) % ROUTES.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => (i - 1 + ROUTES.length) % ROUTES.length);
      } else if (e.key === 'Enter') {
        navigate(ROUTES[idx].path);
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [open, idx, navigate]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={() => setOpen(false)}
    >
      <div
        ref={ref}
        className="bg-surface border-2 border-light w-96 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {ROUTES.map((route, i) => (
          <button
            key={route.path}
            className={`text-left px-6 py-4 transition-all ${i === idx ? 'bg-light text-surface text-2xl' : 'text-dim'}`}
            onMouseEnter={() => setIdx(i)}
            onClick={() => { navigate(route.path); setOpen(false); }}
          >
            {route.label}
          </button>
        ))}
      </div>
    </div>
  );
}

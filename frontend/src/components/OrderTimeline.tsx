"use client";
import React, { useEffect, useState, useRef } from "react";

type Phase = { key: string; label: string; time?: Date | null };

export default function OrderTimeline({ phases, currentIndex }: { phases: Phase[]; currentIndex: number }) {
  const [announce, setAnnounce] = useState<string>("");
  const [revealed, setRevealed] = useState<boolean[]>(() => phases.map(() => false));
  const timeouts = useRef<number[]>([]);

  // Announce current status on mount and whenever currentIndex changes.
  useEffect(() => {
    const step = phases[currentIndex];
    if (!step) return;
    const when = step.time ? ` at ${step.time.toLocaleString()}` : "";
    setAnnounce(`Current status: ${step.label}${when}`);
  }, [currentIndex, phases]);

  // Entrance stagger for steps
  useEffect(() => {
    // clear any existing timeouts
    timeouts.current.forEach((t) => clearTimeout(t));
    timeouts.current = [];

    const baseDelay = 90; // ms between steps
    phases.forEach((_, i) => {
      const id = window.setTimeout(() => {
        setRevealed((r) => {
          const copy = [...r];
          copy[i] = true;
          return copy;
        });
      }, i * baseDelay + 120);
      timeouts.current.push(id);
    });

    return () => {
      timeouts.current.forEach((t) => clearTimeout(t));
      timeouts.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phases.length]);

  return (
    <div>
      {/* Live region for screen readers */}
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>

      <ol className="flex items-center justify-between gap-2 mb-4" role="list">
        {phases.map((p, i) => {
          const done = Boolean(p.time && i <= currentIndex);
          const active = i === currentIndex && p.time !== null;
          const timeLabel = p.time ? ` — ${p.time.toLocaleString()}` : "";

          return (
            <li key={p.key} className="flex-1 text-center" role="listitem">
              <div className="mx-auto mb-2">
                <div
                  tabIndex={0}
                  role="button"
                  aria-pressed={active}
                  aria-current={active ? "step" : undefined}
                  aria-label={`${p.label}${timeLabel}`}
                  onFocus={() => setAnnounce(`${p.label}${timeLabel}`)}
                  onMouseEnter={() => setAnnounce(`${p.label}${timeLabel}`)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transform transition-[transform,opacity,box-shadow] duration-500 ease-in-out motion-reduce:transition-none ${done ? 'bg-olive-green text-white border-olive-green' : 'bg-white text-slate-500 border-slate-200'} ${active ? 'scale-110 ring-4 ring-olive-green/25 shadow-md' : ''} ${revealed[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                >
                  {/* micro-illustration per step */}
                  <span className={`step-illustration ${active || done ? 'bloom' : ''}`} aria-hidden>
                    {i === 0 && (
                      <svg className={`w-6 h-6 ${done ? 'text-white' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke={done ? 'none' : 'currentColor'} fill={done ? '#ffffff' : 'none'} />
                        <path d="M9 12l2 2 4-4" stroke={done ? '#ffffff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg className={`w-6 h-6 ${done ? 'text-white' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="6" y="8" width="12" height="8" rx="2" stroke={done ? 'none' : 'currentColor'} fill={done ? '#ffffff' : 'none'} />
                        <path d="M12 8v8" stroke={done ? '#ffffff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg className={`w-6 h-6 ${done ? 'text-white' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 12h18" stroke={done ? '#ffffff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <g className={`petal ${done ? '' : ''}`}> 
                          <path d="M7 8c2-2 6-2 8 0" stroke={done ? '#ffffff' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      </svg>
                    )}
                    {i === 3 && (
                      <svg className={`w-6 h-6 ${done ? 'text-white' : 'text-slate-600'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 9l4 6" stroke={done ? '#ffffff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="14" r="1.5" fill={done ? '#ffffff' : 'currentColor'} />
                      </svg>
                    )}
                  </span>
                </div>
              </div>

        <div className={`text-xs transition-colors duration-300 ease-in-out motion-reduce:transition-none ${active ? 'text-olive-green font-semibold' : 'text-slate-500'}`}>
                {p.label}
              </div>
      </li>
          );
        })}
      </ol>

      <div className="relative h-2 mb-6" aria-hidden>
        <div className="absolute inset-0 flex items-center">
          <div className="h-1 bg-slate-100 w-full rounded-full" />
          <div
            className="absolute left-0 h-1 rounded-full bg-olive-green transition-all duration-700 ease-in-out motion-reduce:transition-none"
            style={{ width: `${(currentIndex / Math.max(phases.length - 1, 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

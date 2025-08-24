"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import styles from './Tooltip.module.css';
import { useFloating, offset, flip, shift, arrow as arrowMiddleware, autoUpdate } from '@floating-ui/react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';

type Props = {
  triggerLabel?: React.ReactNode;
  triggerClassName?: string;
  children: React.ReactNode;
  placement?: Placement;
  portal?: boolean;
};

const Tooltip: React.FC<Props> = ({ triggerLabel = 'Why?', triggerClassName, children, placement = 'bottom', portal = true }) => {
  const [open, setOpen] = useState(false);
  const [posClass, setPosClass] = useState<string>('placementBottom');
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);

  const { x, y, strategy, refs, middlewareData, placement: finalPlacement } = useFloating({
    placement,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrowMiddleware({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(buttonRef.current);
    refs.setFloating(panelRef.current);
  }, [refs]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      if (!panelRef.current || !buttonRef.current) return;
      const t = ev.target as Node;
      if (!panelRef.current.contains(t) && !buttonRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // set placement class based on computed finalPlacement
    setPosClass('placement' + (finalPlacement ? finalPlacement.charAt(0).toUpperCase() + finalPlacement.slice(1) : 'Bottom'));
  }, [open, finalPlacement]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((s) => !s);
    }
  };

  const sideMap: Record<string, string> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const staticSide = sideMap[finalPlacement.split('-')[0]] || 'top';

  const arrowStyles: React.CSSProperties = middlewareData.arrow
    ? { left: middlewareData.arrow.x ?? '', top: middlewareData.arrow.y ?? '', [staticSide]: '-5px' }
    : {};

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      className={`${styles.panel} ${styles.animateIn} ${styles[posClass as keyof typeof styles] || ''}`}
      style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
    >
      <div ref={arrowRef} className={`${styles.arrow}`} style={arrowStyles} aria-hidden="true" />
      {children}
    </div>
  );

  return (
    <div className="inline-block relative">
      <button
        type="button"
        ref={buttonRef}
        aria-expanded={open}
        aria-controls="tooltip-panel"
        onClick={() => setOpen((s) => !s)}
        onKeyDown={handleKeyDown}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {open && (portal ? createPortal(
        <FocusTrap active={open} focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: true }}>
          {panel}
        </FocusTrap>, document.body) : (
        <FocusTrap active={open} focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: true }}>
          {panel}
        </FocusTrap>
      ))}
    </div>
  );
};

export default Tooltip;

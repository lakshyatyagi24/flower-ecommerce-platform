"use client";
import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href]:not([tabindex="-1"]), button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lockCount = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

/** Body scroll lock shared by every overlay. Compensates the scrollbar so nothing shifts. Restores on release. */
export function lockScroll(): () => void {
  const body = document.body;
  if (lockCount === 0) {
    saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const gap = window.innerWidth - document.documentElement.clientWidth;
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    body.style.overflow = "hidden";
  }
  lockCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;
    if (lockCount === 0 && saved) {
      body.style.overflow = saved.overflow;
      body.style.paddingRight = saved.paddingRight;
      saved = null;
    }
  };
}

/**
 * Modal behaviour for overlays (mobile menu, cart drawer): scroll lock, Escape to close, Tab kept inside the
 * container, focus moved in on open and returned to whatever had it before on close.
 */
export function useModal(active: boolean, containerRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const release = lockScroll();
    const container = containerRef.current;
    const rendered = (el: HTMLElement) => {
      if (el.closest("[hidden]")) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    };
    const focusables = () =>
      container ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(rendered) : [];

    const first = container?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? container;
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const head = list[0];
      const tail = list[list.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === head || !container.contains(current))) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (current === tail || !container.contains(current))) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      release();
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [active, containerRef]);
}

/** Calls `onDismiss` on Escape or on a pointer press outside `ref` while `active`. */
export function useDismiss(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: (reason: "escape" | "outside") => void,
) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  useEffect(() => {
    if (!active) return;
    const onDown = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current("outside");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current("escape");
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active, ref]);
}

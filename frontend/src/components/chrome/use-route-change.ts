"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Runs `onChange` when the pathname changes (not on mount). Used to close menus and panels after navigation. */
export function useCloseOnRouteChange(onChange: () => void) {
  const pathname = usePathname();
  const last = useRef(pathname);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (last.current !== pathname) {
      last.current = pathname;
      cb.current();
    }
  }, [pathname]);
}

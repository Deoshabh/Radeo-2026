import { useState, useEffect } from "react";

/**
 * Returns a debounced copy of `value` that only updates
 * after `delay` milliseconds of inactivity.
 *
 * @param {*} value  - Raw (fast-changing) value
 * @param {number} delay - Debounce window in ms (default 300)
 * @returns The debounced value
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

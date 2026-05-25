import { useState, useEffect } from "react";

/**
 * Custom hook to debounce any fast-changing value.
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay time in milliseconds (default: 500ms)
 * @returns {any} - Debounced value
 */
export const useDebounce = (value:string, delay = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

import React, { useState, useEffect } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  const initial = initialValue instanceof Function ? initialValue() : initialValue;

  // SSR and private browsing can cause window.localStorage to be undefined.
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return initial;
  }
  
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
      const parsed = JSON.parse(savedValue);
      // If the stored value is null, but we have an initial value, prefer the initial value.
      // This prevents crashes on code that expects an array or object.
      return parsed === null ? initial : parsed;
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // If parsing fails, fall back to initial value
    return initial;
  }
  
  // If no value is found, return the initial value
  return initial;
}

// FIX: Import React to provide the 'React' namespace for types like React.Dispatch.
export function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => getValue(key, initialValue));

  useEffect(() => {
    // SSR and private browsing can cause window.localStorage to be undefined.
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.warn(`localStorage is not available. State for key "${key}" will not be persisted.`);
        return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

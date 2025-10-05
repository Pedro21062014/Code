

import React, { useState, useEffect } from 'react';

function getValue<T>(key: string, initialValue: T | (() => T)): T {
  // SSR and private browsing can cause window.localStorage to be undefined.
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  
  try {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null && savedValue !== 'undefined') {
      return JSON.parse(savedValue);
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // If parsing fails, fall back to initial value
    return initialValue instanceof Function ? initialValue() : initialValue;
  }
  
  // If no value is found, return the initial value
  return initialValue instanceof Function ? initialValue() : initialValue;
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
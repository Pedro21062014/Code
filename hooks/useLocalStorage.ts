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
      
      if (parsed === null) {
        return initial;
      }

      // If expecting an array, ensure it's an array and filter out null/undefined items.
      if (Array.isArray(initial)) {
        return (Array.isArray(parsed) ? parsed.filter(item => item != null) : initial) as T;
      }

      // If expecting an object, ensure it's an object and merge with initial state
      // to guarantee all necessary keys are present.
      if (typeof initial === 'object' && initial !== null) {
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return { ...(initial as object), ...parsed } as T;
        }
        return initial; // Stored type is incorrect, revert.
      }

      return parsed; // For primitive types
    }
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // If parsing fails, fall back to initial value
    return initial;
  }
  
  // If no value is found, return the initial value
  return initial;
}


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

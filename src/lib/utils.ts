// utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// New helper: convert camelCase to snake_case for API payloads
export function toSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snake] = obj[key];
  }
  return result;
}


export function toSnakeCaseFormData<T extends Record<string, any>>(obj: T, fileKey?: keyof T): FormData {
  const formData = new FormData();
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    const value = obj[key];
    if (value !== undefined && value !== null && value !== '') {
      // If this is the file key and value is a File, append it
      if (key === fileKey && value instanceof File) {
        formData.append(snakeKey, value);
      } else {
        formData.append(snakeKey, String(value));
      }
    }
  }
  return formData;
}
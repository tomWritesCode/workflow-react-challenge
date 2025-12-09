import { createContext } from 'react';
import { ValidationError } from '../utils/validation';

export interface ValidationContextValue {
  errors: ValidationError[];
  getErrorsForNode: (nodeId: string) => ValidationError[];
}

export const ValidationContext = createContext<ValidationContextValue | null>(null);

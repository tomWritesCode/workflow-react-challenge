import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { ValidationError } from '../utils/validation';

interface ValidationContextValue {
  errors: ValidationError[];
  getErrorsForNode: (nodeId: string) => ValidationError[];
}

const ValidationContext = createContext<ValidationContextValue | null>(null);

interface ValidationProviderProps {
  errors: ValidationError[];
  children: React.ReactNode;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({ errors, children }) => {
  const getErrorsForNode = useCallback(
    (nodeId: string) => errors.filter((err) => err.nodeId === nodeId),
    [errors]
  );

  const value = useMemo(
    () => ({
      errors,
      getErrorsForNode,
    }),
    [errors, getErrorsForNode]
  );

  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>;
};

export const useValidation = (): ValidationContextValue => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

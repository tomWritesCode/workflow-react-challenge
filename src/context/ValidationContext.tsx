import React, { useCallback, useMemo } from 'react';
import { ValidationError } from '../utils/validation';
import { ValidationContext } from './validationContextDef';

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

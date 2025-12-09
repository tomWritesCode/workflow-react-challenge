import { useContext } from 'react';
import { ValidationContext, ValidationContextValue } from '../context/validationContextDef';

export const useValidation = (): ValidationContextValue => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};

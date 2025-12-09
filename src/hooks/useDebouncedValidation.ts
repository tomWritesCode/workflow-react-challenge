import { useEffect, useState, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { validateWorkflow, ValidationError } from '../utils/validation';

export interface UseDebouncedValidationReturn {
  errors: ValidationError[];
  isValid: boolean;
}

/**
 * @param nodes - Array of workflow nodes to validate
 * @param edges - Array of workflow edges to validate
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Object containing validation errors and validity status
 */
export function useDebouncedValidation(
  nodes: Node[],
  edges: Edge[],
  delay = 300
): UseDebouncedValidationReturn {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);

  // Memoize JSON serialization for stable dependency tracking
  const nodesJson = useMemo(() => JSON.stringify(nodes), [nodes]);
  const edgesJson = useMemo(() => JSON.stringify(edges), [edges]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const result = validateWorkflow(nodes, edges);
      setErrors(result.errors);
      setIsValid(result.isValid);
    }, delay);

    return () => clearTimeout(timeoutId);
    // deps of nodes and edges will cause a constant recalling of the effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesJson, edgesJson, delay]);

  return { errors, isValid };
}

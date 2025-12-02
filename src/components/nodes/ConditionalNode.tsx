import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, X, AlertCircle } from 'lucide-react';
import { Box, Text, Flex, IconButton } from '@radix-ui/themes';

/**
 * Represents a route (true/false path) in a conditional node
 */
export interface ConditionalRoute {
  id: 'true' | 'false';
  label: string;
  condition?: string;
}

/**
 * Comparison operators for conditional evaluation
 */
export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'is_empty'
  | 'greater_than'
  | 'less_than'
  | 'contains';

/**
 * Data structure for the Conditional node
 */
export interface ConditionalNodeData {
  label: string;
  customName?: string;
  fieldToEvaluate?: string;
  operator?: ConditionalOperator;
  value?: string;
  routes?: ConditionalRoute[];
  onDelete?: () => void;
  validationErrors?: Array<{ id: string; message: string }>;
}

/**
 * Props for the ConditionalNode component
 */
export interface ConditionalNodeProps {
  data: ConditionalNodeData;
  id: string;
}

/**
 * ConditionalNode - Represents a decision point in the workflow
 * Evaluates a condition and routes to different paths based on the result
 */
export const ConditionalNode: React.FC<ConditionalNodeProps> = ({ data, id }) => {
  const hasErrors = data.validationErrors && data.validationErrors.length > 0;

  const trueRoute = data.routes?.find((r) => r.id === 'true') || {
    id: 'true' as const,
    label: 'True',
  };
  const falseRoute = data.routes?.find((r) => r.id === 'false') || {
    id: 'false' as const,
    label: 'False',
  };

  return (
    <Box
      px="4"
      py="3"
      position="relative"
      style={{
        backgroundColor: 'var(--amber-9)',
        color: 'white',
        borderRadius: 'var(--radius-3)',
        boxShadow: 'var(--shadow-2)',
        border: '2px solid var(--amber-10)',
        minWidth: '180px',
      }}
    >
      {/* Error indicator */}
      {hasErrors && (
        <Box
          position="absolute"
          style={{
            top: '-8px',
            left: '-8px',
            width: '20px',
            height: '20px',
          }}
        >
          <AlertCircle fill="var(--red-9)" size={20} />
        </Box>
      )}

      {/* Delete button */}
      {data.onDelete && (
        <Box
          position="absolute"
          style={{
            top: '-8px',
            right: '-8px',
          }}
        >
          <IconButton
            size="1"
            color="red"
            variant="solid"
            radius="full"
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete?.();
            }}
            title="Delete node"
            style={{
              width: '24px',
              height: '24px',
              padding: 0,
              border: '2px solid white',
            }}
          >
            <X size={14} />
          </IconButton>
        </Box>
      )}

      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--amber-10)',
          border: '2px solid white',
        }}
      />

      <Flex align="center" gap="2" justify="center" mb="2">
        <GitBranch size={16} />
        <Text size="2" weight="bold">
          {data.customName || data.label}
        </Text>
      </Flex>

      <Text size="1" align="center" mb="2" style={{ opacity: 0.9 }}>
        {data.fieldToEvaluate
          ? `${data.fieldToEvaluate} ${data.operator || ''} ${data.value || ''}`
          : 'Click to configure'}
      </Text>

      {/* Route Labels */}
      <Flex direction="column" gap="1" style={{ opacity: 0.8 }}>
        <Text size="1">↗ {trueRoute.label}</Text>
        <Text size="1">↘ {falseRoute.label}</Text>
      </Flex>

      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{
          top: '40%',
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--green-9)',
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{
          top: '70%',
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--red-9)',
          border: '2px solid white',
        }}
      />
    </Box>
  );
};

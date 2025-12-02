import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, X, AlertCircle } from 'lucide-react';
import { Box, Text, Flex, IconButton } from '@radix-ui/themes';

/**
 * Represents a single field in a form
 */
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'string' | 'number' | 'dropdown' | 'checkbox';
  required: boolean;
  options?: string[]; // For dropdown type
}

/**
 * Data structure for the Form node
 */
export interface FormNodeData {
  label: string;
  customName?: string;
  fields?: FormField[];
  onDelete?: () => void;
  validationErrors?: Array<{ id: string; message: string }>;
}

/**
 * Props for the FormNode component
 */
export interface FormNodeProps {
  data: FormNodeData;
  id: string;
}

/**
 * FormNode - Represents a user input form in the workflow
 * Collects data from users through configurable fields
 */
export const FormNode: React.FC<FormNodeProps> = ({ data, id }) => {
  const hasErrors = data.validationErrors && data.validationErrors.length > 0;

  return (
    <Box
      px="4"
      py="3"
      position="relative"
      style={{
        backgroundColor: 'var(--blue-9)',
        color: 'white',
        borderRadius: 'var(--radius-3)',
        boxShadow: 'var(--shadow-2)',
        border: '2px solid var(--blue-10)',
        minWidth: '150px',
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
          backgroundColor: 'var(--blue-10)',
          border: '2px solid white',
        }}
      />

      <Flex align="center" gap="2" justify="center" mb="2">
        <FileText size={16} />
        <Text size="2" weight="bold">
          {data.customName || data.label}
        </Text>
      </Flex>

      <Text size="1" align="center" style={{ opacity: 0.9 }}>
        {data.fields && data.fields.length > 0
          ? `${data.fields.length} field${data.fields.length !== 1 ? 's' : ''}`
          : 'Click to add fields'}
      </Text>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--blue-10)',
          border: '2px solid white',
        }}
      />
    </Box>
  );
};

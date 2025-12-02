import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, X, AlertCircle } from 'lucide-react';
import { Box, Text, Flex, IconButton } from '@radix-ui/themes';

/**
 * HTTP methods supported by the API node
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Data structure for the API node
 */
export interface ApiNodeData {
  label: string;
  customName?: string;
  url?: string;
  method?: HttpMethod;
  requestBody?: Record<string, string>;
  onDelete?: () => void;
  validationErrors?: Array<{ id: string; message: string }>;
}

/**
 * Props for the ApiNode component
 */
export interface ApiNodeProps {
  data: ApiNodeData;
  id: string;
}

/**
 * ApiNode - Represents an HTTP API call in the workflow
 * Makes external API requests and processes responses
 */
export const ApiNode: React.FC<ApiNodeProps> = ({ data, id }) => {
  const hasErrors = data.validationErrors && data.validationErrors.length > 0;

  return (
    <Box
      px="4"
      py="3"
      position="relative"
      style={{
        backgroundColor: 'var(--purple-9)',
        color: 'white',
        borderRadius: 'var(--radius-3)',
        boxShadow: 'var(--shadow-2)',
        border: '2px solid var(--purple-10)',
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
            width: '24px',
            height: '24px',
          }}
        >
          <AlertCircle fill="var(--red-9)" size={24} />
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
          backgroundColor: 'var(--purple-10)',
          border: '2px solid white',
        }}
      />

      <Flex align="center" gap="2" justify="center" mb="2">
        <Globe size={16} />
        <Text size="2" weight="bold">
          {data.label}
        </Text>
      </Flex>

      <Text size="1" align="center" style={{ opacity: 0.9 }}>
        Click to configure API call
      </Text>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--purple-10)',
          border: '2px solid white',
        }}
      />
    </Box>
  );
};

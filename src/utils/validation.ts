import { Node, Edge } from '@xyflow/react';
import type { FormNodeData } from '../components/nodes/FormNode';
import type { ConditionalNodeData } from '../components/nodes/ConditionalNode';
import type { ApiNodeData } from '../components/nodes/ApiNode';

export interface ValidationError {
  id: string;
  type: 'error';
  message: string;
  nodeId?: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Helper functions for readability in the codebase
function isEmpty(value: string | undefined | null): boolean {
  return !value || value.trim() === '';
}

function meetsMinLength(value: string | undefined | null, minLength: number): boolean {
  return !!value && value.trim().length >= minLength;
}

function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /^https?:\/\/.+/.test(url.trim());
}

/**
 * Validation criteria for a Form node:
 * - Custom Name: Required, min 3 characters
 * - Field name: Required, alphanumeric only (no spaces), min 2 characters
 * - Field label: Required, min 2 characters
 */
export function validateFormNode(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as unknown as FormNodeData;

  // Validate custom name
  if (isEmpty(data.customName)) {
    errors.push({
      id: `${node.id}-customName-required`,
      type: 'error',
      message: 'Form name is required',
      nodeId: node.id,
      field: 'customName',
    });
  } else if (!meetsMinLength(data.customName, 3)) {
    errors.push({
      id: `${node.id}-customName-minLength`,
      type: 'error',
      message: 'Form name must be at least 3 characters',
      nodeId: node.id,
      field: 'customName',
    });
  }

  // Validate fields array
  if (!data.fields || data.fields.length === 0) {
    errors.push({
      id: `${node.id}-fields-empty`,
      type: 'error',
      message: 'Form must have at least one field',
      nodeId: node.id,
      field: 'fields',
    });
  } else {
    // Validate each field
    data.fields.forEach((field, index) => {
      // Validate field name
      if (isEmpty(field.name)) {
        errors.push({
          id: `${node.id}-field-${field.id}-name-required`,
          type: 'error',
          message: `Field ${index + 1}: Name is required`,
          nodeId: node.id,
          field: `field-${field.id}-name`,
        });
      } else if (!isAlphanumeric(field.name)) {
        errors.push({
          id: `${node.id}-field-${field.id}-name-alphanumeric`,
          type: 'error',
          message: `Field ${index + 1}: Name must be alphanumeric (no spaces)`,
          nodeId: node.id,
          field: `field-${field.id}-name`,
        });
      } else if (!meetsMinLength(field.name, 2)) {
        errors.push({
          id: `${node.id}-field-${field.id}-name-minLength`,
          type: 'error',
          message: `Field ${index + 1}: Name must be at least 2 characters`,
          nodeId: node.id,
          field: `field-${field.id}-name`,
        });
      }

      // Validate field label
      if (isEmpty(field.label)) {
        errors.push({
          id: `${node.id}-field-${field.id}-label-required`,
          type: 'error',
          message: `Field ${index + 1}: Label is required`,
          nodeId: node.id,
          field: `field-${field.id}-label`,
        });
      } else if (!meetsMinLength(field.label, 2)) {
        errors.push({
          id: `${node.id}-field-${field.id}-label-minLength`,
          type: 'error',
          message: `Field ${index + 1}: Label must be at least 2 characters`,
          nodeId: node.id,
          field: `field-${field.id}-label`,
        });
      }
    });
  }

  return errors;
}

/**
 * Validation criteria for a Conditional node
 * - Custom Name: Required, min 3 characters
 * - Field to Evaluate: Required
 * - Operator: Required
 * - Value: Required (except when operator is `is_empty`)
 */
export function validateConditionalNode(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as unknown as ConditionalNodeData;

  // Validate custom name
  if (isEmpty(data.customName)) {
    errors.push({
      id: `${node.id}-customName-required`,
      type: 'error',
      message: 'Condition name is required',
      nodeId: node.id,
      field: 'customName',
    });
  } else if (!meetsMinLength(data.customName, 3)) {
    errors.push({
      id: `${node.id}-customName-minLength`,
      type: 'error',
      message: 'Condition name must be at least 3 characters',
      nodeId: node.id,
      field: 'customName',
    });
  }

  // Validate field to evaluate
  if (isEmpty(data.fieldToEvaluate)) {
    errors.push({
      id: `${node.id}-fieldToEvaluate-required`,
      type: 'error',
      message: 'Field to evaluate is required',
      nodeId: node.id,
      field: 'fieldToEvaluate',
    });
  }

  // Validate operator
  if (!data.operator) {
    errors.push({
      id: `${node.id}-operator-required`,
      type: 'error',
      message: 'Operator is required',
      nodeId: node.id,
      field: 'operator',
    });
  }

  // Validate value (only required if operator is not 'is_empty')
  if (data.operator !== 'is_empty' && isEmpty(data.value)) {
    errors.push({
      id: `${node.id}-value-required`,
      type: 'error',
      message: 'Value is required for this operator',
      nodeId: node.id,
      field: 'value',
    });
  }

  return errors;
}

/**
 * Validation criteria for an API node
 * - URL: Required, must start with http:// or https://
 * - Method: Required (GET, POST, PUT, DELETE)
 */
export function validateApiNode(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as unknown as ApiNodeData;

  // Validate URL
  if (isEmpty(data.url)) {
    errors.push({
      id: `${node.id}-url-required`,
      type: 'error',
      message: 'API URL is required',
      nodeId: node.id,
      field: 'url',
    });
  } else if (!isValidUrl(data.url)) {
    errors.push({
      id: `${node.id}-url-invalid`,
      type: 'error',
      message: 'URL must start with http:// or https://',
      nodeId: node.id,
      field: 'url',
    });
  }

  // Validate method
  if (!data.method) {
    errors.push({
      id: `${node.id}-method-required`,
      type: 'error',
      message: 'HTTP method is required',
      nodeId: node.id,
      field: 'method',
    });
  }

  return errors;
}

/**
 * Validation criteria for the overall workflow structure
 * - Must contain exactly one Start block
 * - Must contain exactly one End block
 * - Must have at least one work node (Form, API, or Conditional) between Start and End
 * - All nodes must be properly connected (all routes validated)
 * - All nodes must be reachable from Start
 * - End must be reachable from Start
 */
export function validateWorkflowStructure(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Count Start and End nodes
  const startNodes = nodes.filter((node) => node.type === 'start');
  const endNodes = nodes.filter((node) => node.type === 'end');

  // Check for at least one work node (not Start or End)
  const workNodes = nodes.filter((node) => node.type !== 'start' && node.type !== 'end');
  if (
    nodes.length > 0 &&
    startNodes.length === 1 &&
    endNodes.length === 1 &&
    workNodes.length === 0
  ) {
    errors.push({
      id: 'workflow-no-work-nodes',
      type: 'error',
      message:
        'Workflow must contain at least one Form, API, or Conditional block between Start and End',
    });
  }

  // Validate exactly one Start node
  if (startNodes.length === 0) {
    errors.push({
      id: 'workflow-no-start',
      type: 'error',
      message: 'Workflow must have exactly one Start block',
    });
  } else if (startNodes.length > 1) {
    errors.push({
      id: 'workflow-multiple-starts',
      type: 'error',
      message: `Workflow has ${startNodes.length} Start blocks, but must have exactly one`,
    });
  }

  // Validate exactly one End node
  if (endNodes.length === 0) {
    errors.push({
      id: 'workflow-no-end',
      type: 'error',
      message: 'Workflow must have exactly one End block',
    });
  } else if (endNodes.length > 1) {
    errors.push({
      id: 'workflow-multiple-ends',
      type: 'error',
      message: `Workflow has ${endNodes.length} End blocks, but must have exactly one`,
    });
  }

  // Validate conditional nodes have both routes connected
  const conditionalNodes = nodes.filter((node) => node.type === 'conditional');
  conditionalNodes.forEach((node) => {
    const trueEdge = edges.find((edge) => edge.source === node.id && edge.sourceHandle === 'true');
    const falseEdge = edges.find(
      (edge) => edge.source === node.id && edge.sourceHandle === 'false'
    );

    if (!trueEdge) {
      errors.push({
        id: `${node.id}-route-true-missing`,
        type: 'error',
        message: `Conditional "${node.data.customName || node.data.label}" is missing TRUE route connection`,
        nodeId: node.id,
      });
    }

    if (!falseEdge) {
      errors.push({
        id: `${node.id}-route-false-missing`,
        type: 'error',
        message: `Conditional "${node.data.customName || node.data.label}" is missing FALSE route connection`,
        nodeId: node.id,
      });
    }
  });

  // Only perform connectivity checks if we have exactly one Start and one End
  if (startNodes.length === 1 && endNodes.length === 1) {
    const startNode = startNodes[0];
    const endNode = endNodes[0];

    // Check if Start node has outgoing connections
    const startHasOutgoing = edges.some((edge) => edge.source === startNode.id);
    if (!startHasOutgoing && nodes.length > 1) {
      errors.push({
        id: 'workflow-start-no-outgoing',
        type: 'error',
        message: 'Start block has no outgoing connections',
        nodeId: startNode.id,
      });
    }

    // Check if End node has incoming connections
    const endHasIncoming = edges.some((edge) => edge.target === endNode.id);
    if (!endHasIncoming && nodes.length > 1) {
      errors.push({
        id: 'workflow-end-no-incoming',
        type: 'error',
        message: 'End block has no incoming connections',
        nodeId: endNode.id,
      });
    }

    // Perform graph traversal to find reachable nodes from Start
    const reachableNodes = new Set<string>();
    const queue: string[] = [startNode.id];
    reachableNodes.add(startNode.id);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const outgoingEdges = edges.filter((edge) => edge.source === currentId);

      outgoingEdges.forEach((edge) => {
        if (!reachableNodes.has(edge.target)) {
          reachableNodes.add(edge.target);
          queue.push(edge.target);
        }
      });
    }

    // Find orphaned nodes (nodes not reachable from Start)
    nodes.forEach((node) => {
      if (!reachableNodes.has(node.id) && node.id !== startNode.id) {
        const nodeName = node.data.customName || node.data.label || `${node.type} node`;
        errors.push({
          id: `${node.id}-not-reachable`,
          type: 'error',
          message: `"${nodeName}" is not reachable from Start block`,
          nodeId: node.id,
        });
      }
    });
  }

  return errors;
}

/**
 * Top level validation function where all criteria are met from each node
 */
export function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate each node based on its type
  nodes.forEach((node) => {
    switch (node.type) {
      case 'form':
        allErrors.push(...validateFormNode(node));
        break;
      case 'conditional':
        allErrors.push(...validateConditionalNode(node));
        break;
      case 'api':
        allErrors.push(...validateApiNode(node));
        break;
      // Start and End nodes don't need validation
      case 'start':
      case 'end':
        break;
    }
  });

  allErrors.push(...validateWorkflowStructure(nodes, edges));

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

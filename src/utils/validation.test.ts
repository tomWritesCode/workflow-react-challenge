import { describe, it, expect } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import {
  validateFormNode,
  validateConditionalNode,
  validateApiNode,
  validateWorkflowStructure,
  validateWorkflow,
} from './validation';

describe('Form Node Validation', () => {
  it('should validate all form node requirements', () => {
    const invalidNode = {
      id: 'test-1',
      type: 'form',
      position: { x: 0, y: 0 },
      data: {
        label: 'Form',
        customName: 'AB', // Too short
        fields: [
          { id: 'f1', name: 'a', label: 'X', type: 'string', required: false }, // Name and label too short
          { id: 'f2', name: 'has space', label: 'Valid Label', type: 'string', required: false }, // Invalid characters
        ],
      },
    } as Node;

    const errors = validateFormNode(invalidNode);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === 'customName')).toBe(true);
    expect(errors.some((e) => e.message.includes('alphanumeric'))).toBe(true);
  });
});

describe('Conditional Node Validation', () => {
  it('should validate all conditional node requirements', () => {
    const invalidNode = {
      id: 'test-1',
      type: 'conditional',
      position: { x: 0, y: 0 },
      data: {
        label: 'Conditional',
        customName: 'AB', // Too short
        fieldToEvaluate: '', // Empty
        operator: undefined, // Missing
        value: '', // Empty (and operator not is_empty)
      },
    } as Node;

    const errors = validateConditionalNode(invalidNode);
    expect(errors.length).toBeGreaterThanOrEqual(3);
    expect(errors.some((e) => e.field === 'customName')).toBe(true);
    expect(errors.some((e) => e.field === 'fieldToEvaluate')).toBe(true);
    expect(errors.some((e) => e.field === 'operator')).toBe(true);
  });

  it('should not require value when operator is is_empty', () => {
    const node = {
      id: 'test-1',
      type: 'conditional',
      position: { x: 0, y: 0 },
      data: {
        label: 'Conditional',
        customName: 'EmptyCheck',
        fieldToEvaluate: 'email',
        operator: 'is_empty',
        value: '', // Empty is OK for is_empty operator
      },
    } as Node;

    const errors = validateConditionalNode(node);
    expect(errors.every((e) => e.field !== 'value')).toBe(true);
  });
});

describe('API Node Validation', () => {
  it('should validate API node requirements', () => {
    const invalidNode = {
      id: 'test-1',
      type: 'api',
      position: { x: 0, y: 0 },
      data: {
        label: 'API',
        url: 'invalid-url', // Invalid format
        method: undefined, // Missing
      },
    } as Node;

    const errors = validateApiNode(invalidNode);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.some((e) => e.field === 'url')).toBe(true);
    expect(errors.some((e) => e.field === 'method')).toBe(true);
  });
});

describe('Workflow Structure Validation', () => {
  it('should require exactly one Start and one End node', () => {
    const nodesNoStart: Node[] = [
      { id: '1', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End' } },
    ];
    const edges: Edge[] = [];

    const errorsNoStart = validateWorkflowStructure(nodesNoStart, edges);
    expect(errorsNoStart.some((e) => e.message.includes('Start'))).toBe(true);

    const nodesMultipleStarts: Node[] = [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: '2', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: '3', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End' } },
    ];

    const errorsMultiple = validateWorkflowStructure(nodesMultipleStarts, edges);
    expect(errorsMultiple.some((e) => e.message.includes('Start blocks'))).toBe(true);
  });

  it('should validate conditional node routing', () => {
    const nodes: Node[] = [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      {
        id: '2',
        type: 'conditional',
        position: { x: 0, y: 0 },
        data: { label: 'Conditional', customName: 'Test' },
      },
      { id: '3', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End' } },
    ];
    const edges: Edge[] = [
      { id: 'e0', source: '1', target: '2' },
      { id: 'e1', source: '2', target: '3', sourceHandle: 'true' },
      // Missing FALSE route
    ];

    const errors = validateWorkflowStructure(nodes, edges);
    expect(errors.some((e) => e.message.includes('FALSE route'))).toBe(true);
  });

  it('should validate node connectivity and reachability', () => {
    const disconnectedNodes: Node[] = [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: '2', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End' } },
      {
        id: '3',
        type: 'form',
        position: { x: 0, y: 0 },
        data: { label: 'Form', customName: 'Orphan' },
      },
    ];
    const edges: Edge[] = [{ id: 'e1', source: '1', target: '2' }];

    const errors = validateWorkflowStructure(disconnectedNodes, edges);
    expect(errors.some((e) => e.message.includes('not reachable'))).toBe(true);
  });

  it('should require at least one work node between Start and End', () => {
    const nodesDirectConnection: Node[] = [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: '2', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End' } },
    ];
    const edges: Edge[] = [{ id: 'e1', source: '1', target: '2' }];

    const errors = validateWorkflowStructure(nodesDirectConnection, edges);
    expect(errors.some((e) => e.message.includes('at least one Form, API, or Conditional'))).toBe(
      true
    );
  });
});

describe('Complete Workflow Validation', () => {
  it('should return valid result for valid workflow', () => {
    const nodes: Node[] = [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      {
        id: '2',
        type: 'form',
        position: { x: 0, y: 0 },
        data: {
          label: 'Form',
          customName: 'UserForm',
          fields: [
            { id: 'f1', name: 'username', label: 'Username', type: 'string', required: false },
          ],
        },
      } as Node,
      {
        id: '3',
        type: 'api',
        position: { x: 0, y: 0 },
        data: {
          label: 'API',
          url: 'https://api.example.com/submit',
          method: 'POST',
        },
      } as Node,
      { id: '4', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' },
      { id: 'e3', source: '3', target: '4' },
    ];

    const result = validateWorkflow(nodes, edges);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

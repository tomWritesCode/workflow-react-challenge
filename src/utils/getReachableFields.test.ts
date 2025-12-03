import { describe, it, expect } from 'vitest';
import { Node, Edge } from '@xyflow/react';
import { getReachableFields } from './getReachableFields';

/**
 * Helper to create a Form node with fields
 */
function createFormNode(id: string, fieldNames: string[]): Node {
  return {
    id,
    type: 'form',
    position: { x: 0, y: 0 },
    data: {
      label: 'Form',
      customName: `Form ${id}`,
      fields: fieldNames.map((name, i) => ({
        id: `${id}-field-${i}`,
        name,
        label: name,
        type: 'string',
        required: false,
      })),
    },
  };
}

function createConditionalNode(id: string): Node {
  return {
    id,
    type: 'conditional',
    position: { x: 0, y: 0 },
    data: {
      label: 'Conditional',
      customName: `Conditional ${id}`,
      fieldToEvaluate: '',
      operator: 'equals',
      value: '',
    },
  };
}

describe('getReachableFields', () => {
  it('should return fields from upstream Form nodes', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      createFormNode('form1', ['username', 'email']),
      createConditionalNode('cond1'),
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'form1' },
      { id: 'e2', source: 'form1', target: 'cond1' },
    ];

    const fields = getReachableFields('cond1', nodes, edges);

    expect(fields).toContain('username');
    expect(fields).toContain('email');
    expect(fields).toHaveLength(2);
  });

  it('should only include fields from upstream nodes, excluding downstream, disconnected, and parallel paths', () => {
    /**
     * Workflow structure:
     *
     *                    ┌──> Form2 (upstream) ──┐
     * Start -> Form1 ───┤                        ├──> Conditional (target)
     *                    └──> Form3 (upstream) ──┘
     *
     * Form4 -> End (separate path, should NOT appear)
     * Form5 (orphaned, should NOT appear)
     * Conditional -> Form6 (downstream, should NOT appear) -> End2
     */
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      createFormNode('form1', ['baseField']),
      createFormNode('form2', ['branchAField']),
      createFormNode('form3', ['branchBField']),
      createConditionalNode('cond1'),
      createFormNode('form4', ['separatePathField']),
      createFormNode('form5', ['orphanedField']),
      createFormNode('form6', ['downstreamField']),
      { id: 'end1', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End 1' } },
      { id: 'end2', type: 'end', position: { x: 0, y: 0 }, data: { label: 'End 2' } },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'form1' },
      { id: 'e2', source: 'form1', target: 'form2' },
      { id: 'e3', source: 'form1', target: 'form3' },
      { id: 'e4', source: 'form2', target: 'cond1' },
      { id: 'e5', source: 'form3', target: 'cond1' },
      { id: 'e6', source: 'form4', target: 'end1' },
      { id: 'e7', source: 'cond1', target: 'form6', sourceHandle: 'true' },
      { id: 'e8', source: 'form6', target: 'end2' },
    ];

    const fields = getReachableFields('cond1', nodes, edges);

    // Should include upstream fields
    expect(fields).toContain('baseField');
    expect(fields).toContain('branchAField');
    expect(fields).toContain('branchBField');

    // Should NOT include non-upstream fields
    expect(fields).not.toContain('separatePathField');
    expect(fields).not.toContain('orphanedField');
    expect(fields).not.toContain('downstreamField');

    expect(fields).toHaveLength(3);
  });

  it('should return empty array when no Form nodes are upstream', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      createConditionalNode('cond1'),
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'start', target: 'cond1' }];

    const fields = getReachableFields('cond1', nodes, edges);

    expect(fields).toHaveLength(0);
  });

  it('should deduplicate field names and skip empty names', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      createFormNode('form1', ['email', 'name']),
      {
        id: 'form2',
        type: 'form',
        position: { x: 0, y: 0 },
        data: {
          label: 'Form',
          customName: 'Form 2',
          fields: [
            { id: 'f1', name: 'email', label: 'Email', type: 'string', required: false }, // duplicate
            { id: 'f2', name: '', label: 'Empty', type: 'string', required: false }, // empty name
            { id: 'f3', name: 'phone', label: 'Phone', type: 'string', required: false },
          ],
        },
      },
      createConditionalNode('cond1'),
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'form1' },
      { id: 'e2', source: 'form1', target: 'form2' },
      { id: 'e3', source: 'form2', target: 'cond1' },
    ];

    const fields = getReachableFields('cond1', nodes, edges);

    expect(fields).toContain('email');
    expect(fields).toContain('name');
    expect(fields).toContain('phone');
    expect(fields).not.toContain('');
    expect(fields.filter((f) => f === 'email')).toHaveLength(1);
    expect(fields).toHaveLength(3);
  });
});

import { Node, Edge } from '@xyflow/react';
import type { FormNodeData } from '../components/nodes/FormNode';

/**
 * @param nodeId - The ID of the node to start traversing backwards from
 * @param nodes - All nodes in the workflow
 * @param edges - All edges in the workflow
 * @returns Array of unique field names from upstream Form nodes
 */
export function getReachableFields(nodeId: string, nodes: Node[], edges: Edge[]): string[] {
  const reachableNodeIds = new Set<string>();
  const queue: string[] = [nodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    const incomingEdges = edges.filter((edge) => edge.target === currentId);

    for (const edge of incomingEdges) {
      if (!reachableNodeIds.has(edge.source)) {
        reachableNodeIds.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  const fieldNames: string[] = [];

  for (const id of reachableNodeIds) {
    const node = nodes.find((n) => n.id === id);
    if (node?.type === 'form') {
      const formData = node.data as unknown as FormNodeData;
      if (formData.fields) {
        for (const field of formData.fields) {
          if (field.name && !fieldNames.includes(field.name)) {
            fieldNames.push(field.name);
          }
        }
      }
    }
  }

  return fieldNames;
}

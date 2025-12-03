import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  AlertDialog,
  Text,
  TextField,
  Select,
  Checkbox,
  IconButton,
  Separator,
  Badge,
  Callout,
} from '@radix-ui/themes';
import { Save, X, Plus, Trash2, AlertCircle, Info } from 'lucide-react';

import { StartNode } from './nodes/StartNode';
import { FormNode, FormField } from './nodes/FormNode';
import { ConditionalNode, ConditionalRoute, ConditionalOperator } from './nodes/ConditionalNode';
import { ApiNode } from './nodes/ApiNode';
import { EndNode } from './nodes/EndNode';
import { BlockPanel } from './BlockPanel';
import { validateWorkflow, ValidationError } from '../utils/validation';
import { useAutoSave, loadSavedWorkflow } from '../hooks/useAutoSave';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { RestoreWorkflowDialog } from './RestoreWorkflowDialog';
import { getReachableFields } from '../utils/getReachableFields';
import { AutoComplete } from './AutoComplete';

import type { FormNodeData } from './nodes/FormNode';
import type { ApiNodeData } from './nodes/ApiNode';
import type { ConditionalNodeData } from './nodes/ConditionalNode';
import type { StartNodeData } from './nodes/StartNode';
import type { EndNodeData } from './nodes/EndNode';

const nodeTypes = {
  start: StartNode,
  form: FormNode,
  conditional: ConditionalNode,
  api: ApiNode,
  end: EndNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const getId = () => `node_${crypto.randomUUID()}`;

const getBlockConfig = (blockType: string): WorkflowNodeData => {
  const configs: Record<string, WorkflowNodeData> = {
    start: {
      label: 'Start',
    },
    form: {
      label: 'Form',
      customName: 'Form',
      fields: [],
    },
    conditional: {
      label: 'Conditional',
      customName: 'Conditional',
      fieldToEvaluate: '',
      operator: 'equals' as ConditionalOperator,
      value: '',
      routes: [
        { id: 'true' as const, label: 'True', condition: '' },
        { id: 'false' as const, label: 'False', condition: '' },
      ] as ConditionalRoute[],
    },
    api: {
      label: 'API Call',
      url: '',
      method: 'GET',
    },
    end: {
      label: 'End',
    },
  };
  return configs[blockType] || { label: blockType };
};

/**
 * Union type representing all possible node data types
 */
export type WorkflowNodeData =
  | FormNodeData
  | ApiNodeData
  | ConditionalNodeData
  | StartNodeData
  | EndNodeData;

/**
 * WorkflowEditor - Main component for building and editing workflows
 * Provides a visual canvas for creating workflows with nodes and connections
 */
export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [savedWorkflowData, setSavedWorkflowData] =
    useState<ReturnType<typeof loadSavedWorkflow>>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isWorkflowValid, setIsWorkflowValid] = useState(false);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    const saved = loadSavedWorkflow();
    if (saved) {
      setSavedWorkflowData(saved);
      setShowRestoreDialog(true);
    }
  }, []);

  const nodesJson = useMemo(() => JSON.stringify(nodes), [nodes]);
  const edgesJson = useMemo(() => JSON.stringify(edges), [edges]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const result = validateWorkflow(nodes, edges);
      setValidationErrors(result.errors);
      setIsWorkflowValid(result.isValid);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [nodesJson, edgesJson]);

  const { saveStatus, lastSaved, clearSaved } = useAutoSave({
    nodes,
    edges,
    isValid: isWorkflowValid,
  });

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);

      let label = '';
      if (sourceNode?.type === 'conditional' && params.sourceHandle) {
        const conditionalData = sourceNode.data as unknown as ConditionalNodeData;
        const route = conditionalData.routes?.find((r) => r.id === params.sourceHandle);
        label = route?.label || params.sourceHandle || '';
      }

      setEdges((eds) => addEdge({ ...params, label }, eds));
    },
    [setEdges, nodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedEdge(null);

    if (node.type === 'start' || node.type === 'end') {
      return;
    }
    setSelectedNode(node);
  }, []);

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      setSelectedEdge(null);
    },
    [setEdges]
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        )
      );
    },
    [setNodes]
  );

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const nodeErrors = validationErrors.filter((err) => err.nodeId === node.id);
        return {
          ...node,
          data: {
            ...node.data,
            validationErrors: nodeErrors,
          },
        };
      })
    );
  }, [validationErrors, setNodes]);

  const closeEditor = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // When clicking the error from the error panel we want to select the node and center the viewport on it
  const handleErrorClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          }))
        );

        if (reactFlowInstance.current) {
          reactFlowInstance.current.setCenter(node.position.x + 75, node.position.y + 50, {
            duration: 400,
          });
        }

        if (node.type !== 'start' && node.type !== 'end') {
          setSelectedNode(node);
        }
      }
    },
    [nodes, setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Safeguard against deleting if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((event.key === 'Delete' || event.key === 'Backspace') && !isTyping) {
        // Prevent default behavior (like navigating back) when deleting
        event.preventDefault();

        if (selectedNode) {
          deleteNode(selectedNode.id);
        } else if (selectedEdge) {
          deleteEdge(selectedEdge.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedEdge, deleteNode, deleteEdge]);

  const handleAddBlock = useCallback(
    (blockType: string) => {
      const config = getBlockConfig(blockType);

      let position = { x: 100, y: 100 };

      if (reactFlowInstance.current) {
        const canvasCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        };

        // Convert screen coordinates to flow coordinates
        position = reactFlowInstance.current.screenToFlowPosition({
          x: canvasCenter.x,
          y: canvasCenter.y,
        });
      }

      const nodeId = getId();
      const newNode: Node = {
        id: nodeId,
        type: blockType,
        position,
        data: {
          ...config,
          onDelete: () => deleteNode(nodeId),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, deleteNode]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const handleSave = () => {
    const workflowConfig = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      })),
      metadata: {
        name: 'Sample Workflow',
        version: '1.0.0',
        created: new Date().toISOString(),
      },
    };

    console.log('Workflow Configuration:', JSON.stringify(workflowConfig, null, 2));

    setShowSaveDialog(true);
  };

  const handleRestoreWorkflow = useCallback(() => {
    if (savedWorkflowData) {
      setNodes(savedWorkflowData.nodes);
      setEdges(savedWorkflowData.edges);
      setShowRestoreDialog(false);
      setSavedWorkflowData(null);
    }
  }, [savedWorkflowData, setNodes, setEdges]);

  const handleDiscardWorkflow = useCallback(() => {
    clearSaved();
    setShowRestoreDialog(false);
    setSavedWorkflowData(null);
  }, [clearSaved]);

  return (
    <Flex minHeight="100vh" direction="column" style={{ width: '100%' }}>
      <Card m="4" mb="0">
        <Flex flexGrow="1" justify="between" align="center">
          <Heading as="h2">Workflow Editor</Heading>

          <Flex gap="3" align="center">
            {(nodes.length > 0 || edges.length > 0) && (
              <SaveStatusIndicator saveStatus={saveStatus} lastSaved={lastSaved} />
            )}
            <Button onClick={handleSave}>
              <Save size={16} />
              Save Workflow
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Main Content with Panel and Canvas */}
      <Flex flexGrow="1" m="4" mt="2" gap="4">
        {/* Left Panels */}
        <Flex direction="column" gap="4">
          <BlockPanel onAddBlock={handleAddBlock} />
          <ValidationPanel errors={validationErrors} onErrorClick={handleErrorClick} />
        </Flex>

        {/* Workflow Canvas */}
        <Box flexGrow="1" style={{ minHeight: '600px' }}>
          <Card style={{ overflow: 'hidden', height: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges.map((edge) => ({
                ...edge,
                selected: selectedEdge?.id === edge.id,
                style:
                  selectedEdge?.id === edge.id
                    ? { strokeWidth: 3, stroke: '#3b82f6' }
                    : { strokeWidth: 2, stroke: '#94a3b8' },
              }))}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onInit={onInit}
              nodeTypes={nodeTypes}
              fitView
              defaultEdgeOptions={{
                style: { strokeWidth: 2, stroke: '#94a3b8' },
                type: 'smoothstep',
                animated: false,
              }}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius)',
              }}
            >
              <Controls
                style={{ backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <MiniMap
                style={{ backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'start':
                      return '#10b981';
                    case 'form':
                      return '#3b82f6';
                    case 'conditional':
                      return '#f59e0b';
                    case 'api':
                      return '#a855f7';
                    case 'end':
                      return '#ef4444';
                    default:
                      return '#6b7280';
                  }
                }}
              />
              <Background color="#e2e8f0" gap={20} />
            </ReactFlow>
          </Card>
        </Box>

        {/* Right Panel - Node Editor */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdate={updateNodeData}
            onClose={closeEditor}
            onDelete={deleteNode}
            errors={validationErrors}
          />
        )}
      </Flex>

      <AlertDialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Workflow Saved</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Your workflow configuration has been saved to the browser console. Check the developer
            console for the complete configuration details.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </AlertDialog.Cancel>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      <RestoreWorkflowDialog
        open={showRestoreDialog}
        workflowData={savedWorkflowData}
        onRestore={handleRestoreWorkflow}
        onDiscard={handleDiscardWorkflow}
        onOpenChange={setShowRestoreDialog}
      />
    </Flex>
  );
};

/**
 * Props for the NodeEditor component
 */
export interface NodeEditorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  errors?: ValidationError[];
}

/**
 * NodeEditor - Configuration panel for editing node properties
 * Displays different fields based on the node type
 */
export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  onUpdate,
  onClose,
  onDelete,
  errors = [],
}) => {
  const [formData, setFormData] = useState<WorkflowNodeData>(
    node.data as unknown as WorkflowNodeData
  );

  const nodeErrors = errors.filter((err) => err.nodeId === node.id);

  const getFieldError = (fieldName: string) => {
    return nodeErrors.find((err) => err.field === fieldName);
  };

  const getFormFieldError = (fieldId: string, fieldProp: 'name' | 'label') => {
    return nodeErrors.find((err) => err.field?.includes(`field-${fieldId}-${fieldProp}`));
  };

  const handleChange = (field: string, value: string | FormField[] | ConditionalRoute[]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onUpdate(node.id, newData);
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'string' as const,
      required: false,
    };
    const formNodeData = formData as FormNodeData;
    const newFields = [...(formNodeData.fields || []), newField];
    handleChange('fields', newFields);
  };

  const removeField = (fieldId: string) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).filter((f) => f.id !== fieldId);
    handleChange('fields', newFields);
  };

  const updateField = (
    fieldId: string,
    fieldProp: keyof FormField,
    value: string | boolean | string[]
  ) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) =>
      f.id === fieldId ? { ...f, [fieldProp]: value } : f
    );
    handleChange('fields', newFields);
  };

  const addDropdownOption = (fieldId: string) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) =>
      f.id === fieldId ? { ...f, options: [...(f.options || []), ''] } : f
    );
    handleChange('fields', newFields);
  };

  const updateDropdownOption = (fieldId: string, optionIndex: number, value: string) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions[optionIndex] = value;
        return { ...f, options: newOptions };
      }
      return f;
    });
    handleChange('fields', newFields);
  };

  const removeDropdownOption = (fieldId: string, optionIndex: number) => {
    const formNodeData = formData as FormNodeData;
    const newFields = (formNodeData.fields || []).map((f) => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions.splice(optionIndex, 1);
        return { ...f, options: newOptions };
      }
      return f;
    });
    handleChange('fields', newFields);
  };

  return (
    <Card style={{ width: '350px', height: '100%', position: 'relative', overflowY: 'auto' }}>
      <Flex direction="column" gap="4" p="4">
        <Flex justify="between" align="center">
          <Heading size="4">Edit {node.type}</Heading>
          <Flex gap="2">
            <IconButton
              variant="ghost"
              size="1"
              color="red"
              onClick={() => onDelete(node.id)}
              title="Delete node (Delete/Backspace)"
            >
              <Trash2 size={16} />
            </IconButton>
            <IconButton variant="ghost" size="1" onClick={onClose} title="Close editor">
              <X size={16} />
            </IconButton>
          </Flex>
        </Flex>

        {node.type === 'form' && (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2">
                Form Name
              </Text>
              <TextField.Root
                value={(formData as FormNodeData).customName || ''}
                onChange={(e) => handleChange('customName', e.target.value)}
                placeholder="Enter form name"
              />
              {getFieldError('customName') && (
                <Text size="1" color="red" mt="1">
                  {getFieldError('customName').message}
                </Text>
              )}
            </Box>

            <Separator size="4" />

            <Flex justify="between" align="center">
              <Text size="2" weight="bold">
                Fields
              </Text>
              <Button size="1" onClick={addField} style={{ gap: '4px' }}>
                <Plus size={14} />
                Add Field
              </Button>
            </Flex>

            {((formData as FormNodeData).fields || []).map((field, index) => (
              <Card
                key={field.id}
                variant="surface"
                style={{ padding: '12px', backgroundColor: 'var(--gray-3)' }}
              >
                <Flex direction="column" gap="3">
                  <Flex justify="between" align="center">
                    <Text size="1" weight="bold" color="gray">
                      Field {index + 1}
                    </Text>
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </Flex>

                  <Box>
                    <Text size="1" mb="2">
                      Field Name
                    </Text>
                    <TextField.Root
                      size="1"
                      value={field.name || ''}
                      onChange={(e) => updateField(field.id, 'name', e.target.value)}
                      placeholder="field_name"
                    />
                    {getFormFieldError(field.id, 'name') && (
                      <Text size="1" color="red" mt="1">
                        {getFormFieldError(field.id, 'name').message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text size="1" mb="2">
                      Label
                    </Text>
                    <TextField.Root
                      size="1"
                      value={field.label || ''}
                      onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      placeholder="Display Label"
                    />
                    {getFormFieldError(field.id, 'label') && (
                      <Text size="1" color="red" mt="1">
                        {getFormFieldError(field.id, 'label').message}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Text size="1" mb="2" mr="2">
                      Type
                    </Text>
                    <Select.Root
                      value={field.type || 'string'}
                      onValueChange={(val) => updateField(field.id, 'type', val)}
                      size="1"
                    >
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="string">String</Select.Item>
                        <Select.Item value="number">Number</Select.Item>
                        <Select.Item value="dropdown">Dropdown</Select.Item>
                        <Select.Item value="checkbox">Checkbox</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  {field.type === 'dropdown' && (
                    <Box>
                      <Flex justify="between" align="center" mb="2">
                        <Text size="1">Options</Text>
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => addDropdownOption(field.id)}
                          style={{ gap: '2px' }}
                        >
                          <Plus size={12} />
                        </Button>
                      </Flex>
                      <Flex direction="column" gap="2">
                        {(field.options || []).map((option, optIndex) => (
                          <Flex key={optIndex} gap="2" align="center">
                            <TextField.Root
                              size="1"
                              value={option}
                              onChange={(e) =>
                                updateDropdownOption(field.id, optIndex, e.target.value)
                              }
                              placeholder={`Option ${optIndex + 1}`}
                              style={{ flex: 1 }}
                            />
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={() => removeDropdownOption(field.id, optIndex)}
                            >
                              <X size={12} />
                            </IconButton>
                          </Flex>
                        ))}
                      </Flex>
                    </Box>
                  )}

                  <Flex gap="2" align="center" style={{ marginTop: '4px' }}>
                    <Checkbox
                      checked={field.required || false}
                      onCheckedChange={(checked) => updateField(field.id, 'required', checked)}
                      size="1"
                    />
                    <Text size="1">Required</Text>
                  </Flex>
                </Flex>
              </Card>
            ))}

            {(!(formData as FormNodeData).fields ||
              (formData as FormNodeData).fields?.length === 0) && (
              <Box p="3">
                <Text size="2" align="center" color={getFieldError('fields') ? 'red' : 'gray'}>
                  {getFieldError('fields')
                    ? getFieldError('fields').message
                    : 'No fields added yet'}
                </Text>
              </Box>
            )}
          </Flex>
        )}

        {node.type === 'api' && (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2">
                API URL
              </Text>
              <TextField.Root
                value={(formData as ApiNodeData).url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com"
              />
              {getFieldError('url') && (
                <Text size="1" color="red" mt="1">
                  {getFieldError('url').message}
                </Text>
              )}
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2" mr="2">
                Method
              </Text>
              <Select.Root
                value={(formData as ApiNodeData).method || 'GET'}
                onValueChange={(val) => handleChange('method', val)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="GET">GET</Select.Item>
                  <Select.Item value="POST">POST</Select.Item>
                  <Select.Item value="PUT">PUT</Select.Item>
                  <Select.Item value="DELETE">DELETE</Select.Item>
                </Select.Content>
              </Select.Root>
              {getFieldError('method') && (
                <Text size="1" color="red" mt="1">
                  {getFieldError('method').message}
                </Text>
              )}
            </Box>
          </Flex>
        )}

        {node.type === 'conditional' && (
          <Flex direction="column" gap="4">
            <Box>
              <Text size="2" weight="medium" mb="2">
                Condition Name
              </Text>
              <TextField.Root
                value={(formData as ConditionalNodeData).customName || ''}
                onChange={(e) => handleChange('customName', e.target.value)}
                placeholder="Enter condition name"
              />
              {getFieldError('customName') && (
                <Text size="1" color="red" mt="1">
                  {getFieldError('customName').message}
                </Text>
              )}
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2">
                Field to Evaluate
              </Text>
              <AutoComplete
                value={(formData as ConditionalNodeData).fieldToEvaluate || ''}
                onChange={(val) => handleChange('fieldToEvaluate', val)}
                suggestions={getReachableFields(node.id, nodes, edges)}
                placeholder="field_name"
                error={getFieldError('fieldToEvaluate')?.message}
              />
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2" mr="2">
                Operator
              </Text>
              <Select.Root
                value={(formData as ConditionalNodeData).operator || 'equals'}
                onValueChange={(val) => handleChange('operator', val)}
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="equals">Equals</Select.Item>
                  <Select.Item value="not_equals">Not Equals</Select.Item>
                  <Select.Item value="is_empty">Is Empty</Select.Item>
                  <Select.Item value="greater_than">Greater Than</Select.Item>
                  <Select.Item value="less_than">Less Than</Select.Item>
                  <Select.Item value="contains">Contains</Select.Item>
                </Select.Content>
              </Select.Root>
              {getFieldError('operator') && (
                <Text size="1" color="red" mt="1">
                  {getFieldError('operator').message}
                </Text>
              )}
            </Box>
            <Box>
              <Text size="2" weight="medium" mb="2">
                Value
              </Text>
              <TextField.Root
                value={(formData as ConditionalNodeData).value || ''}
                onChange={(e) => handleChange('value', e.target.value)}
                placeholder="comparison value"
              />
              {getFieldError('value') && (
                <Text size="1" color="red" mt="1">
                  {getFieldError('value').message}
                </Text>
              )}
            </Box>

            <Separator size="4" />

            <Text size="2" weight="bold">
              Routes
            </Text>

            {((formData as ConditionalNodeData).routes || []).map((route) => (
              <Card
                key={route.id}
                variant="surface"
                style={{
                  padding: '12px',
                  backgroundColor: route.id === 'true' ? 'var(--green-3)' : 'var(--red-3)',
                }}
              >
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text size="2" weight="bold" color={route.id === 'true' ? 'green' : 'red'}>
                      {route.id.toUpperCase()} Path
                    </Text>
                  </Flex>

                  <Box>
                    <Text size="1" mb="2">
                      Route Label
                    </Text>
                    <TextField.Root
                      size="1"
                      value={route.label || ''}
                      onChange={(e) => {
                        const conditionalData = formData as ConditionalNodeData;
                        const newRoutes = (conditionalData.routes || []).map((r) =>
                          r.id === route.id ? { ...r, label: e.target.value } : r
                        );
                        handleChange('routes', newRoutes);
                      }}
                      placeholder={route.id === 'true' ? 'e.g., Yes, Success' : 'e.g., No, Failed'}
                    />
                  </Box>

                  <Box>
                    <Text size="1" mb="2">
                      Description (optional)
                    </Text>
                    <TextField.Root
                      size="1"
                      value={route.condition || ''}
                      onChange={(e) => {
                        const conditionalData = formData as ConditionalNodeData;
                        const newRoutes = (conditionalData.routes || []).map((r) =>
                          r.id === route.id ? { ...r, condition: e.target.value } : r
                        );
                        handleChange('routes', newRoutes);
                      }}
                      placeholder="Describe this path"
                    />
                  </Box>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
};

/**
 * Props for the ValidationPanel component
 */
export interface ValidationPanelProps {
  errors: ValidationError[];
  onErrorClick?: (nodeId: string) => void;
}

/**
 * ValidationPanel - Displays workflow validation errors
 * Shows a list of errors that need to be fixed in the workflow
 */
export const ValidationPanel: React.FC<ValidationPanelProps> = ({ errors, onErrorClick }) => {
  const errorCount = errors.length;

  return (
    <Card
      style={{
        width: '256px',
        height: '100%',
        maxHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Flex direction="column" gap="3" p="4" style={{ flex: 1, overflow: 'hidden' }}>
        <Flex justify="between" align="center" style={{ flexShrink: 0 }}>
          <Heading size="3">Errors</Heading>
          {errorCount > 0 && (
            <Badge color="red" size="1">
              {errorCount}
            </Badge>
          )}
        </Flex>

        <Flex direction="column" gap="2" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {errors.length === 0 ? (
            <Callout.Root color="green" size="1">
              <Callout.Icon>
                <Info />
              </Callout.Icon>
              <Callout.Text>No errors found</Callout.Text>
            </Callout.Root>
          ) : (
            errors.map((error) => (
              <Callout.Root
                key={error.id}
                color="red"
                size="1"
                style={{
                  cursor: error.nodeId ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
                onClick={() => error.nodeId && onErrorClick?.(error.nodeId)}
              >
                <Callout.Icon>
                  <AlertCircle />
                </Callout.Icon>
                <Callout.Text>{error.message}</Callout.Text>
              </Callout.Root>
            ))
          )}
        </Flex>
      </Flex>
    </Card>
  );
};

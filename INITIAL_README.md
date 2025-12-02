# Workflow Builder - Frontend Challenge

A visual workflow builder application where users create workflows with different node types. Your task is to implement **form validation** and **auto-save functionality**.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

**Prerequisites:** Node.js 18+

## Challenge Overview

### What's Already Built

- Visual workflow canvas with drag-and-drop
- 5 node types: Start, Form, Conditional, API, End
- Node configuration panel
- Delete nodes (X button or Delete/Backspace key)
- Connect nodes with edges

### What You'll Build

**Part 1: Form Validation**
- Validate all node configuration fields
- Validate workflow structure (one Start block, one End block, proper routing)
- Display inline errors in the editor panel
- Update ValidationPanel (left side) to show all errors

**Part 2: Auto-Save**
- Auto-save to localStorage when workflow is valid
- Debounce saves (2 seconds after changes)
- Show save status indicator
- Restore workflow on app reload with user prompt

**Time Estimate:** 3 hours

## Requirements

### Validation Rules

#### Workflow-Level Validation

**Workflow Structure**
- Must contain exactly one Start block
- Must contain exactly one End block
- All nodes must be properly connected (all routes validated)

#### Node-Level Validation

**Form Node**
- Custom Name: Required, min 3 characters
- Field name: Required, alphanumeric only (no spaces), min 2 characters
- Field label: Required, min 2 characters

**Conditional Node**
- Custom Name: Required, min 3 characters
- Field to Evaluate: Required
- Operator: Required
- Value: Required (except when operator is `is_empty`)

**API Node**
- URL: Required, must start with http:// or https://
- Method: Required (GET, POST, PUT, DELETE)

### Auto-Save Behavior

1. Only save when all nodes pass validation AND workflow structure is valid
2. Wait 2 seconds after last change before saving
3. Store to `localStorage` with key `workflow-autosave`
4. Show save status (saving/saved/error)
5. On app load, prompt user to restore or discard saved workflow

## Deliverables

1. **Validation utility** (`src/utils/`) - Validate node fields and workflow structure (one Start, one End, proper routing)
2. **Auto-save hook** (`src/hooks/`) - Handle debouncing and localStorage
3. **Updated NodeEditor** - Display validation errors inline
4. **Save status display** - Show save state in UI
5. **Restore dialog** - Use Radix UI AlertDialog to prompt on load
6. **ValidationPanel update** - Display real validation errors from all nodes and workflow-level errors

## Tech Stack

- **React 18** + TypeScript
- **Radix UI Themes** - Component library ([docs](https://www.radix-ui.com/themes/docs))
- **ReactFlow** - Canvas/node graph library
- **Vite** - Build tool
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   ├── nodes/              # StartNode, FormNode, ConditionalNode, ApiNode, EndNode
│   ├── WorkflowEditor.tsx  # Main editor component
│   ├── BlockPanel.tsx      # Left panel with blocks
│   └── ValidationPanel.tsx # Validation errors display
├── hooks/                  # CREATE: Auto-save hook
├── utils/                  # CREATE: Validation utilities
├── pages/                  # Index, NotFound
└── main.tsx               # Entry point
```

## Technical Requirements

**TypeScript**
- Strict typing (no `any`)
- Use proper interfaces from node components

**Code Quality**
- Follow existing patterns (see `WorkflowEditor.tsx`)
- Named exports only (no default exports)
- Use Radix UI components for all UI

**Performance**
- Debounce validation: 300ms recommended
- Debounce auto-save: 2000ms required

## Evaluation Criteria

- **Functionality** - Validation and auto-save work correctly
- **Code Quality** - Clean, maintainable, follows patterns
- **User Experience** - Clear errors and feedback
- **Technical** - Efficient debouncing and error handling

## Helpful Tips

1. Start with validation, then add auto-save
2. Check existing node files for data structure types
3. Use `updateNodeData` in WorkflowEditor to update node properties
4. ReactFlow hooks: `useNodesState`, `useEdgesState`
5. Handle localStorage errors gracefully
6. Test incrementally as you build

## Available Radix UI Components

Already imported and ready to use:
- `Box`, `Flex`, `Text`, `Heading`
- `Button`, `IconButton`, `Card`
- `TextField`, `Select`, `Checkbox`, `Badge`
- `AlertDialog`, `Callout`, `Separator`

## Submission Checklist

- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All node-level validation rules implemented
- [ ] Workflow-level validation implemented (one Start, one End, proper routing)
- [ ] Auto-save works with 2-second debounce
- [ ] Workflow restores from localStorage
- [ ] ValidationPanel shows real validation errors
- [ ] Code follows existing patterns

## Bonus (Optional)

- Field name autocomplete for conditional nodes

---

**Reference:** Check `EXAMPLES.md` for code patterns and `src/components/nodes/` for data structures.

Good luck!

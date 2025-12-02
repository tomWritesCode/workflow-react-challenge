import React from 'react';
import { AlertDialog, Button, Flex, Text } from '@radix-ui/themes';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { SavedWorkflowData } from '../hooks/useAutoSave';

dayjs.extend(relativeTime);

export interface RestoreWorkflowDialogProps {
  open: boolean;
  workflowData: SavedWorkflowData | null;
  onRestore: () => void;
  onDiscard: () => void;
  onOpenChange: (open: boolean) => void;
}

/**
 * NOTE: In a multi-device/multi-user environment with backend persistence,
 * we would compare the localStorage timestamp with a server timestamp
 * to detect version conflicts and inform the user if a newer version
 * exists elsewhere. Current implementation is localStorage-only.
 * I would bring this up with product/design as a potential example that could pop up from previous similar experience.
 */
export const RestoreWorkflowDialog: React.FC<RestoreWorkflowDialogProps> = ({
  open,
  workflowData,
  onRestore,
  onDiscard,
  onOpenChange,
}) => {
  if (!workflowData) return null;

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content>
        <AlertDialog.Title>Restore Saved Workflow?</AlertDialog.Title>

        <AlertDialog.Description size="2">
          We found a previously saved workflow from{' '}
          <strong>{dayjs(workflowData.timestamp).fromNow()}</strong>.
        </AlertDialog.Description>

        <Text size="2" color="gray" mt="2">
          {workflowData.nodes.length} node{workflowData.nodes.length !== 1 ? 's' : ''},{' '}
          {workflowData.edges.length} connection{workflowData.edges.length !== 1 ? 's' : ''}
          {' • '}
          {dayjs(workflowData.timestamp).format('MMM D, YYYY [at] h:mm A')}
        </Text>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" onClick={onDiscard}>
              Discard
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button onClick={onRestore}>Restore Workflow</Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};

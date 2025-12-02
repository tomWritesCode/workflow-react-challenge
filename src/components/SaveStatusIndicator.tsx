import React from 'react';
import { Badge, Tooltip, Spinner } from '@radix-ui/themes';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface SaveStatusIndicatorProps {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  saveStatus,
  lastSaved,
}) => {
  if (saveStatus === 'idle') {
    return null;
  }

  const getBadgeColor = (): 'blue' | 'green' | 'red' => {
    switch (saveStatus) {
      case 'saving':
        return 'blue';
      case 'saved':
        return 'green';
      case 'error':
        return 'red';
    }
  };

  const getStatusText = (): string => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Error';
    }
  };

  const getTooltipContent = (): string => {
    if (saveStatus === 'error') {
      return 'Workflow has validation errors.';
    }

    if (saveStatus === 'saving') {
      return 'Saving workflow...';
    }

    if (lastSaved) {
      const relativeTime = dayjs(lastSaved).fromNow();
      const fullDate = dayjs(lastSaved).format('MMM D, YYYY [at] h:mm A');
      return `Last saved ${relativeTime} (${fullDate})`;
    }

    return 'Workflow saved successfully';
  };

  return (
    <Tooltip content={getTooltipContent()}>
      <Badge
        color={getBadgeColor()}
        size="2"
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {saveStatus === 'saving' && <Spinner size="1" />}
        {getStatusText()}
      </Badge>
    </Tooltip>
  );
};

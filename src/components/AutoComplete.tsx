import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, TextField, Text } from '@radix-ui/themes';

export interface AutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  error?: string;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions.filter(
    (suggestion) => suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
  );

  const hasSuggestions = filteredSuggestions.length > 0;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (hasSuggestions) {
      setIsOpen(true);
    }
  };

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
        }
        break;
      case 'Enter':
        if (isOpen && highlightedIndex >= 0) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <Box ref={containerRef}>
      <Box position="relative">
        <TextField.Root
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-expanded={isOpen && hasSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {isOpen && hasSuggestions && (
          <Box
            ref={listRef}
            role="listbox"
            position="absolute"
            style={{
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '2px',
              backgroundColor: 'white',
              border: '1px solid var(--gray-6)',
              borderRadius: 'var(--radius-2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <Box
                key={suggestion}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleSelectSuggestion(suggestion);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: index === highlightedIndex ? 'var(--gray-3)' : 'transparent',
                }}
              >
                <Text size="2">{suggestion}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {error && (
        <Text size="1" color="red" mt="1">
          {error}
        </Text>
      )}
    </Box>
  );
};

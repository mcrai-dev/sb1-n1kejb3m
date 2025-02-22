import React from 'react';

interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number';
  disabled?: boolean;
  placeholder?: string;
}

export function EditableCell({
  value,
  onChange,
  type = 'text',
  disabled = false,
  placeholder
}: EditableCellProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
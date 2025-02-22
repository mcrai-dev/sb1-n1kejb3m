import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectCellProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
}

export function SelectCell({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Sélectionner...'
}: SelectCellProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
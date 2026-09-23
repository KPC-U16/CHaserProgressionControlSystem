'use client';

import type { ReactNode } from 'react';

export type Choice<Value extends string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
  note?: ReactNode;
};

export default function ChoiceGroup<Value extends string>({
  legend,
  name,
  choices,
  selected,
  required = false,
  disabled = false,
  onSelect,
}: {
  legend: ReactNode;
  name: string;
  choices: readonly Choice<Value>[];
  selected: Value | null;
  required?: boolean;
  disabled?: boolean;
  onSelect: (value: Value) => void;
}) {
  return (
    <fieldset className="choice-group" disabled={disabled}>
      <legend>{legend}</legend>
      <div className="choice-options">
        {choices.map((choice) => (
          <label
            className={`choice ${choice.value === selected ? 'selected' : ''}`}
            key={choice.value}
          >
            <input
              type="radio"
              name={name}
              value={choice.value}
              required={required}
              checked={choice.value === selected}
              onChange={() => onSelect(choice.value)}
            />
            {choice.icon}
            {choice.note}
            <strong>{choice.label}</strong>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

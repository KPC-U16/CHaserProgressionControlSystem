'use client';

import type { ReactNode } from 'react';

export type Choice<Value extends string> = {
  value: Value;
  label: string;
  icon?: ReactNode;
  note?: ReactNode;
};

type Common<Value extends string> = {
  legend: ReactNode;
  name: string;
  selected: Value | null;
  required?: boolean;
  disabled?: boolean;
  onSelect: (value: Value) => void;
  onClear?: () => void;
};
type Grouping<Value extends string> =
  | { choices: readonly Choice<Value>[]; sections?: never }
  | { sections: readonly (readonly Choice<Value>[])[]; choices?: never };

export default function ChoiceGroup<Value extends string>({
  legend,
  name,
  selected,
  required = false,
  disabled = false,
  onSelect,
  onClear,
  ...grouping
}: Common<Value> & Grouping<Value>) {
  const sections = grouping.sections ?? [grouping.choices ?? []];
  return (
    <fieldset className="choice-group" disabled={disabled}>
      <legend>
        <span>{legend}</span>
        {onClear && (
          <button
            type="button"
            className="text-button choice-clear"
            disabled={selected === null}
            onClick={onClear}
          >
            選択を解除
          </button>
        )}
      </legend>
      <div className="choice-sections">
        {sections.map((section) => (
          <div className="choice-options" key={section.map((choice) => choice.value).join('-')}>
            {section.map((choice) => (
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
                  onClick={() => choice.value === selected && onClear?.()}
                />
                {choice.icon}
                {choice.note}
                <strong>{choice.label}</strong>
              </label>
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}

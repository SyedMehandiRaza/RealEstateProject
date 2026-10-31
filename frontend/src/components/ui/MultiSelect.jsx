import { useEffect, useId, useRef, useState } from 'react';
import arrowIcon from '../../assets/auth/icon-arrow-filled.svg';
import selectStyles from './Select.module.css';
import styles from './MultiSelect.module.css';

// Multi-select dropdown: Select's look (Figma "Assign Access Permissions" 13009:18217) with a checkbox per
// option, since the list itself is not designed (STAFF-DEC-012). A combobox button opens a listbox with
// aria-multiselectable; Enter or Space toggles the highlighted option, Escape or Tab closes.
// Controlled: `value` is an array of option values, kept in the order of `options`; `onChange(values)`.
// The closed field shows the chosen labels joined by commas.
export default function MultiSelect({
  label,
  options,
  value = [],
  onChange,
  onBlur,
  placeholder = 'Select',
  error,
  id,
  name,
  disabled = false,
  ref,
}) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const labelId = `${buttonId}-label`;
  const listboxId = `${buttonId}-listbox`;
  const errorId = `${buttonId}-error`;
  const optionId = (index) => `${buttonId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const chosen = options.filter((option) => value.includes(option.value));

  function toggle(index) {
    const option = options[index];
    if (!option) return;
    const next = value.includes(option.value)
      ? value.filter((v) => v !== option.value)
      : [...value, option.value];
    onChange?.(options.map((o) => o.value).filter((v) => next.includes(v)));
  }

  function onKeyDown(event) {
    const last = options.length - 1;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        setActiveIndex(0);
        setOpen(true);
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(last);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        toggle(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
    }
  }

  return (
    <div ref={rootRef} className={selectStyles.field}>
      {label && (
        <span id={labelId} className={selectStyles.label}>
          {label}
        </span>
      )}
      <div className={selectStyles.anchor}>
        <button
          ref={ref}
          id={buttonId}
          name={name}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-labelledby={label ? `${labelId} ${buttonId}` : undefined}
          aria-activedescendant={open ? optionId(activeIndex) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          className={[selectStyles.trigger, error && selectStyles.invalid].filter(Boolean).join(' ')}
          onClick={() => setOpen((isOpen) => !isOpen)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        >
          <span className={chosen.length ? selectStyles.value : selectStyles.placeholder}>
            {chosen.length ? chosen.map((option) => option.label).join(', ') : placeholder}
          </span>
          <span className={selectStyles.arrow} aria-hidden="true">
            <img src={arrowIcon} alt="" width={8} height={16} />
          </span>
        </button>
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={label ? labelId : undefined}
          tabIndex={-1}
          hidden={!open}
          className={selectStyles.listbox}
        >
          {options.map((option, index) => {
            const selected = value.includes(option.value);
            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={selected}
                className={[selectStyles.option, styles.option, index === activeIndex && selectStyles.active]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggle(index)}
              >
                <span
                  className={[styles.checkbox, selected && styles.checked].filter(Boolean).join(' ')}
                  aria-hidden="true"
                />
                {option.label}
              </li>
            );
          })}
        </ul>
      </div>
      {error && (
        <p id={errorId} className={selectStyles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

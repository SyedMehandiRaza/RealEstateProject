import { useEffect, useId, useRef, useState } from 'react';
import arrowIcon from '../../assets/auth/icon-arrow-filled.svg';
import styles from './Select.module.css';

// Dropdown (Figma: "WEB Select Experience" 13038:4966, "Docu type" 13038:4986, "WEB Select role" 13038:5020).
// WAI-ARIA select-only combobox: a button with role="combobox" opens a listbox below it.
// Controlled: `value` is the selected option's value ('' or undefined for none), `onChange(value)`.
// With react-hook-form, wrap it in <Controller> and pass field.value / field.onChange / field.onBlur.
// Without a visible `label`, pass `ariaLabel` for the accessible name (the staff Detail status dropdown).
// Keyboard: Enter, Space, Alt+Down or Down/Up open; Up/Down/Home/End move; Enter or Space selects;
// Escape closes; Tab selects the highlighted option and moves on; typing a letter jumps to an option.
export default function Select({
  label,
  options,
  value,
  onChange,
  onBlur,
  placeholder = 'Select',
  error,
  id,
  name,
  disabled = false,
  className,
  ariaLabel,
  ref,
}) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const labelId = `${buttonId}-label`;
  const listboxId = `${buttonId}-listbox`;
  const errorId = `${buttonId}-error`;
  const optionId = (index) => `${buttonId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  // Close when focus or a click lands outside the component.
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function openList(index = selectedIndex >= 0 ? selectedIndex : 0) {
    setActiveIndex(index);
    setOpen(true);
  }

  function choose(index) {
    const option = options[index];
    if (option) onChange?.(option.value);
    setOpen(false);
  }

  function onKeyDown(event) {
    const last = options.length - 1;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        openList(event.key === 'ArrowUp' && selectedIndex < 0 ? last : undefined);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        openList(event.key === 'Home' ? 0 : last);
      } else {
        jumpToLetter(event, true);
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (event.altKey) return;
        setActiveIndex((i) => Math.min(i + 1, last));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) {
          choose(activeIndex);
          return;
        }
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
        choose(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        choose(activeIndex);
        break;
      default:
        jumpToLetter(event, false);
    }
  }

  function jumpToLetter(event, openAfter) {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    const letter = event.key.toLowerCase();
    const start = open ? activeIndex + 1 : selectedIndex + 1;
    const ordered = [...options.slice(start), ...options.slice(0, start)];
    const match = ordered.find((option) => option.label.toLowerCase().startsWith(letter));
    if (!match) return;
    const index = options.indexOf(match);
    if (openAfter) openList(index);
    else setActiveIndex(index);
  }

  return (
    <div ref={rootRef} className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      <div className={styles.anchor}>
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
          aria-label={label ? undefined : ariaLabel}
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          className={[styles.trigger, error && styles.invalid].filter(Boolean).join(' ')}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        >
          <span className={selected ? styles.value : styles.placeholder}>
            {selected ? selected.label : placeholder}
          </span>
          <span className={styles.arrow} aria-hidden="true">
            <img src={arrowIcon} alt="" width={8} height={16} />
          </span>
        </button>
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          tabIndex={-1}
          hidden={!open}
          className={styles.listbox}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              className={[styles.option, index === activeIndex && styles.active].filter(Boolean).join(' ')}
              onMouseEnter={() => setActiveIndex(index)}
              // Keep focus on the combobox so keyboard handling continues after a click.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

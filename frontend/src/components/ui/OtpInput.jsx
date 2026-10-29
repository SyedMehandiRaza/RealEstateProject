import { useEffect, useRef } from 'react';
import styles from './OtpInput.module.css';

const DIGIT = /^\d$/;

// Six one-digit boxes for a verification code (Figma: Verify screens).
// Controlled: `value` is the digits typed so far ('' to '123456'); `onChange(nextValue)`.
// It behaves like one text field split into boxes: typing fills the next box, Backspace deletes,
// arrows move, and pasting a code (any non-digits are dropped) fills the boxes from the cursor.
export default function OtpInput({
  value = '',
  onChange,
  length = 6,
  label = 'Verification code',
  error,
  errorId,
  disabled,
  autoFocus,
  name,
  onBlur,
  className,
}) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  // Value sent to onChange but not rendered yet: focus moves before the parent re-renders.
  const pending = useRef(null);
  useEffect(() => {
    pending.current = null;
  }, [value]);

  function update(next) {
    pending.current = next;
    onChange(next);
  }

  const focusBox = (index) => refs.current[Math.max(0, Math.min(index, length - 1))]?.focus();

  function insert(index, typed) {
    const start = Math.min(index, value.length);
    const next = (value.slice(0, start) + typed + value.slice(start + typed.length)).slice(0, length);
    update(next);
    focusBox(start + typed.length);
  }

  function handleChange(event, index) {
    const raw = event.target.value.replace(/\D/g, '');
    if (!raw) return;
    // Browser autofill (autocomplete="one-time-code") can put the whole code into one box.
    if (raw.length > 2) {
      insert(index, raw);
      return;
    }
    // The box may already hold a digit; the newly typed one is the character that was added.
    insert(index, (raw.length > 1 ? raw.replace(digits[index], '') || raw : raw).slice(-1));
  }

  function handlePaste(event, index) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) insert(index, pasted);
  }

  function handleKeyDown(event, index) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const target = digits[index] ? index : index - 1;
      if (target < 0) return;
      update(value.slice(0, target) + value.slice(target + 1));
      focusBox(target);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      if (digits[index]) update(value.slice(0, index) + value.slice(index + 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(Math.min(index + 1, value.length));
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusBox(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusBox(value.length);
    } else if (event.key.length === 1 && !DIGIT.test(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  // Boxes after the first empty one cannot hold a digit yet, so focus jumps back to that box.
  function handleFocus(event, index) {
    const filled = (pending.current ?? value).length;
    if (index > filled) focusBox(filled);
    else event.target.select();
  }

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={error ? errorId : undefined}
      className={[styles.group, className].filter(Boolean).join(' ')}
    >
      {digits.map((digit, index) => (
        <div key={index} className={[styles.box, error && styles.invalid].filter(Boolean).join(' ')}>
          <input
            ref={(el) => {
              refs.current[index] = el;
            }}
            className={styles.input}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={error ? true : undefined}
            name={name ? `${name}-${index}` : undefined}
            value={digit}
            placeholder=" "
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(event) => handleChange(event, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={(event) => handlePaste(event, index)}
            onFocus={(event) => handleFocus(event, index)}
            onBlur={onBlur}
          />
          <span className={styles.caret} aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

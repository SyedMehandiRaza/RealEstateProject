import { useId, useState } from 'react';
import eyeIcon from '../../assets/auth/icon-eye.svg';
import styles from './TextInput.module.css';

// Labelled text field with an optional leading icon (Figma: auth form fields).
// type="password" adds the eye button that shows or hides the value.
// Works with react-hook-form: spread register('name') into it (React 19 passes `ref` as a prop).
export default function TextInput({ label, icon, type = 'text', error, id, className, ref, ...inputProps }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={[styles.control, error && styles.invalid].filter(Boolean).join(' ')}>
        {icon && <img src={icon} alt="" width={16} height={16} className={styles.icon} />}
        <input
          id={inputId}
          ref={ref}
          type={isPassword && visible ? 'text' : type}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            aria-controls={inputId}
            onClick={() => setVisible((v) => !v)}
          >
            <img src={eyeIcon} alt="" width={16.2503} height={9.58333} />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

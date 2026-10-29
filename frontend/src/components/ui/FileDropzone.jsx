import { useId, useState } from 'react';
import styles from './FileDropzone.module.css';

// Dashed upload area (Figma: Upload Document 13038:4598, 13038:4612, 13038:4626).
// A visually hidden native file input inside a label: a click, Enter or Space opens the file
// picker, and a file dropped on the area is passed the same way. `onFileSelect(file)` receives
// one File; checking its type and size (documentUploadSchema) is the caller's job.
// The copy is passed in because it differs per slot (Profile Photo: "JPG, PNG", DEC-021).
export default function FileDropzone({
  onFileSelect,
  title = 'Drag & drop OR click to browse',
  formatsText = 'Supported formats: PDF, JPG, PNG',
  maxSizeText = 'Max size: 10 MB',
  accept,
  error,
  disabled = false,
  id,
  className,
  ref,
  ...inputProps
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [dragging, setDragging] = useState(false);

  function onChange(event) {
    const file = event.target.files?.[0];
    // Clear the input so choosing the same file again still fires a change.
    event.target.value = '';
    if (file) onFileSelect?.(file);
  }

  function onDragOver(event) {
    event.preventDefault();
    if (disabled) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  }

  function onDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDragging(false);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect?.(file);
  }

  const zoneClasses = [
    styles.zone,
    dragging && styles.dragging,
    error && styles.invalid,
    disabled && styles.disabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className={zoneClasses}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={ref}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={onChange}
          {...inputProps}
        />
        <span className={styles.title}>{title}</span>
        {formatsText && <span className={styles.formats}>{formatsText}</span>}
        {maxSizeText && <span className={styles.maxSize}>{maxSizeText}</span>}
      </label>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

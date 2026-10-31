import { useEffect, useId, useRef } from 'react';
import closeIcon from '../../assets/ui/close.svg';
import styles from './Modal.module.css';

// Open dialogs, oldest first: Escape belongs to the last one.
const openDialogs = [];

// Centred dialog over a backdrop (Figma: Add Staff 13009:18190, Staff Detail 13009:18226, success modal
// 13009:18180). Escape and the close icon call onClose, unless a control inside handled Escape itself
// (an open dropdown calls preventDefault). Focus moves into the dialog when it opens and back when it closes.
// `title` is the accessible name; `showHeader` draws the Figma title row with the close icon. The header stays
// in place and the body scrolls when the dialog is taller than the screen. `className` styles the dialog
// (padding, gap), `bodyClassName` the body.
export default function Modal({
  title,
  onClose,
  children,
  width,
  showHeader = true,
  className,
  bodyClassName,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    openDialogs.push(dialog);
    dialog?.focus();
    return () => {
      openDialogs.splice(openDialogs.indexOf(dialog), 1);
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!onClose) return undefined;
    // Only the topmost dialog closes (a confirmation opened over the Detail).
    const onKeyDown = (event) => {
      const isTop = openDialogs[openDialogs.length - 1] === dialogRef.current;
      if (event.key === 'Escape' && !event.defaultPrevented && isTop) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={showHeader ? titleId : undefined}
        aria-label={showHeader ? undefined : title}
        tabIndex={-1}
        className={[styles.dialog, className].filter(Boolean).join(' ')}
        style={width ? { '--modal-width': width } : undefined}
      >
        {showHeader && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {onClose && (
              <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
                <img src={closeIcon} alt="" width="28" height="28" />
              </button>
            )}
          </div>
        )}
        <div className={[styles.body, bodyClassName].filter(Boolean).join(' ')}>{children}</div>
      </div>
    </div>
  );
}

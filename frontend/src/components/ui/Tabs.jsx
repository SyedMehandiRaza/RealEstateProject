import { useRef } from 'react';
import styles from './Tabs.module.css';

// Segmented tab bar (Figma: Buyer / Agent / Developers on Sign Up).
// Controlled: `value` is the selected tab's value, `onChange(value)` selects another one.
// Keyboard: Left/Right arrows (wrapping), Home and End move and select (WAI-ARIA tabs pattern).
export default function Tabs({ tabs, value, onChange, label, idPrefix = 'tab', className }) {
  const refs = useRef([]);

  function select(index) {
    const tab = tabs[index];
    onChange(tab.value);
    refs.current[index]?.focus();
  }

  function onKeyDown(event, index) {
    const last = tabs.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div role="tablist" aria-label={label} className={[styles.tablist, className].filter(Boolean).join(' ')}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${tab.value}`}
            aria-selected={selected}
            aria-controls={tab.panelId}
            tabIndex={selected ? 0 : -1}
            className={[styles.tab, selected && styles.selected].filter(Boolean).join(' ')}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

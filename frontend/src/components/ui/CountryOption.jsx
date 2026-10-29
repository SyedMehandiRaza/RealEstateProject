import { useId } from 'react';
import checkIcon from '../../assets/auth/icon-check-fill.svg';
import styles from './CountryOption.module.css';

// One country row (Figma: Select a country 13038:3950; selected row 13038:3959, unselected 13038:3965).
// A visually hidden native radio inside a label: render several with the same `name` inside an
// element with role="radiogroup" and the browser provides arrow-key selection.
// Works with react-hook-form: spread register('country') and pass `value`.
export default function CountryOption({ flag, label, id, className, ref, ...inputProps }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label htmlFor={inputId} className={[styles.option, className].filter(Boolean).join(' ')}>
      <input ref={ref} id={inputId} type="radio" className={styles.input} {...inputProps} />
      <span className={styles.content}>
        <img src={flag} alt="" width={40} height={30} className={styles.flag} />
        <span className={styles.label}>{label}</span>
      </span>
      <img src={checkIcon} alt="" width={20} height={20} className={styles.check} />
    </label>
  );
}

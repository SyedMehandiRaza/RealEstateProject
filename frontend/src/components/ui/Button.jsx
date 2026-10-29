import styles from './Button.module.css';

// Primary action button (Figma: "Log In", "Sign Up", "Verify" on the Auth Module page).
// Full width by default, as in every auth frame.
export default function Button({ type = 'button', fullWidth = true, className, children, ...rest }) {
  const classes = [styles.button, fullWidth && styles.fullWidth, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

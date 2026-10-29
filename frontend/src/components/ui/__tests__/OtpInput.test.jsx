import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpInput from '../OtpInput.jsx';

function Controlled({ initial = '', onChange = () => {}, ...props }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <OtpInput
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        {...props}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

const box = (n) => screen.getByRole('textbox', { name: `Digit ${n} of 6` });
const value = () => screen.getByTestId('value').textContent;

describe('OtpInput', () => {
  it('renders six labelled boxes in a labelled group', () => {
    render(<Controlled />);
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
    expect(box(1)).toHaveAttribute('inputmode', 'numeric');
    expect(box(1)).toHaveAttribute('autocomplete', 'one-time-code');
  });

  it('typing fills the boxes and moves focus forward', async () => {
    render(<Controlled />);
    await userEvent.click(box(1));
    await userEvent.keyboard('123');
    expect(value()).toBe('123');
    expect(box(3)).toHaveValue('3');
    expect(box(4)).toHaveFocus();
  });

  it('ignores non-digits', async () => {
    render(<Controlled />);
    await userEvent.click(box(1));
    await userEvent.keyboard('a1b');
    expect(value()).toBe('1');
  });

  it('accepts a pasted 6-digit code', async () => {
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(box(1));
    await userEvent.paste('123456');
    expect(onChange).toHaveBeenLastCalledWith('123456');
    expect(box(6)).toHaveValue('6');
    expect(box(6)).toHaveFocus();
  });

  it('drops spaces and dashes from a pasted code and stops at six digits', async () => {
    render(<Controlled />);
    await userEvent.click(box(1));
    await userEvent.paste('12-34 56 78');
    expect(value()).toBe('123456');
  });

  it('Backspace clears the current digit, then moves back', async () => {
    render(<Controlled initial="123" />);
    await userEvent.click(box(4));
    await userEvent.keyboard('{Backspace}');
    expect(value()).toBe('12');
    expect(box(3)).toHaveFocus();
    await userEvent.keyboard('{Backspace}');
    expect(value()).toBe('1');
  });

  it('arrow keys move between filled boxes', async () => {
    render(<Controlled initial="123" />);
    await userEvent.click(box(3));
    await userEvent.keyboard('{ArrowLeft}');
    expect(box(2)).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(box(4)).toHaveFocus();
  });

  it('typing over a filled box replaces that digit', async () => {
    render(<Controlled initial="123" />);
    await userEvent.click(box(2));
    await userEvent.keyboard('9');
    expect(value()).toBe('193');
  });

  // TASK-043 regression: the browser fires no change event when the typed digit equals the selected
  // one, so focus used to stay on that box and the next digit overwrote it ('987654' became '98764').
  it('typing the same digit over a filled box still moves focus forward', async () => {
    render(<Controlled initial="12345" />);
    await userEvent.click(box(1));
    await userEvent.keyboard('987654');
    expect(value()).toBe('987654');
    expect(box(6)).toHaveFocus();
  });

  it('focus on a box past the first empty one goes to that empty box', async () => {
    render(<Controlled initial="12" />);
    await userEvent.click(box(6));
    expect(box(3)).toHaveFocus();
  });

  it('links an error and marks the boxes invalid', () => {
    render(
      <>
        <Controlled error errorId="code-error" />
        <p id="code-error">Enter the 6-digit code</p>
      </>,
    );
    expect(screen.getByRole('group', { name: 'Verification code' })).toHaveAccessibleDescription(
      'Enter the 6-digit code',
    );
    expect(box(1)).toHaveAttribute('aria-invalid', 'true');
  });

  it('is keyboard-reachable', async () => {
    render(<Controlled />);
    await userEvent.tab();
    expect(box(1)).toHaveFocus();
  });
});

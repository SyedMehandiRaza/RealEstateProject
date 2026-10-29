import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button.jsx';

describe('Button', () => {
  it('renders a button with its label and type="button" by default', () => {
    render(<Button>Log In</Button>);
    expect(screen.getByRole('button', { name: 'Log In' })).toHaveAttribute('type', 'button');
  });

  it('submits a form when type="submit"', async () => {
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Sign Up</Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Verify
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();
  });

  it('is reachable with the keyboard', async () => {
    render(<Button>Log In</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Log In' })).toHaveFocus();
  });
});

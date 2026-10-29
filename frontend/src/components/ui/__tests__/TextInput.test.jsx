import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import TextInput from '../TextInput.jsx';

describe('TextInput', () => {
  it('labels the input and shows the placeholder', () => {
    render(<TextInput label="Email" placeholder="Enter Email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('placeholder', 'Enter Email');
  });

  it('renders the leading icon as decoration only', () => {
    const { container } = render(<TextInput label="Email" icon="email.svg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('links the error message with aria-describedby and marks the input invalid', () => {
    render(<TextInput label="Email" error="Enter a valid email address" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address');
  });

  it('has no description and is not invalid without an error', () => {
    render(<TextInput label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('toggles password visibility with the eye button', async () => {
    render(<TextInput label="Password" type="password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('has no eye button for other types', () => {
    render(<TextInput label="Email" type="email" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is keyboard-reachable: input then eye button', async () => {
    render(<TextInput label="Password" type="password" />);
    await userEvent.tab();
    expect(screen.getByLabelText('Password')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveFocus();
  });

  it('works with react-hook-form register', async () => {
    const onValid = jest.fn();
    function Form() {
      const { register, handleSubmit } = useForm();
      return (
        <form onSubmit={handleSubmit(onValid)}>
          <TextInput label="Full Name" {...register('fullName')} />
          <button type="submit">Send</button>
        </form>
      );
    }
    render(<Form />);
    await userEvent.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onValid).toHaveBeenCalledWith({ fullName: 'Jane Doe' }, expect.anything());
  });
});

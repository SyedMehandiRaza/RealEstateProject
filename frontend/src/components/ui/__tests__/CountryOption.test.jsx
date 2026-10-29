import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import CountryOption from '../CountryOption.jsx';

const COUNTRIES = [
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SG', label: 'Singapore' },
  { value: 'US', label: 'United States' },
];

function Form({ onSubmit }) {
  const { register, handleSubmit } = useForm({ defaultValues: { country: 'AE' } });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div role="radiogroup" aria-label="Country">
        {COUNTRIES.map((country) => (
          <CountryOption
            key={country.value}
            flag={`${country.value}.png`}
            label={country.label}
            value={country.value}
            {...register('country')}
          />
        ))}
      </div>
      <button type="submit">Continue</button>
    </form>
  );
}

describe('CountryOption', () => {
  it('is a radio named by the country, with decorative images', () => {
    const { container } = render(
      <CountryOption flag="ae.png" label="United Arab Emirates" name="c" value="AE" />,
    );
    expect(screen.getByRole('radio', { name: 'United Arab Emirates' })).not.toBeChecked();
    container.querySelectorAll('img').forEach((img) => expect(img).toHaveAttribute('alt', ''));
  });

  it('selects by click and submits the value with react-hook-form', async () => {
    const onSubmit = jest.fn();
    render(<Form onSubmit={onSubmit} />);
    expect(screen.getByRole('radio', { name: 'United Arab Emirates' })).toBeChecked();

    await userEvent.click(screen.getByText('Singapore'));
    expect(screen.getByRole('radio', { name: 'Singapore' })).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit.mock.calls[0][0]).toEqual({ country: 'SG' });
  });

  it('is keyboard operable: Tab reaches the group, arrows change the selection', async () => {
    render(<Form onSubmit={() => {}} />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'United Arab Emirates' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Singapore' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Singapore' })).toHaveFocus();
  });
});

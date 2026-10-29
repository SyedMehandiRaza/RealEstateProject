import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Controller, useForm } from 'react-hook-form';
import Select from '../Select.jsx';

const OPTIONS = [
  { value: '0-2', label: '0–2' },
  { value: '3-5', label: '3–5' },
  { value: '6-10', label: '6–10' },
  { value: '10+', label: '10+' },
];

function Controlled({ initial = '', onChange = () => {}, ...props }) {
  const [value, setValue] = useState(initial);
  return (
    <Select
      label="Experience Level"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      {...props}
    />
  );
}

describe('Select', () => {
  it('renders a labelled, collapsed combobox showing the placeholder', () => {
    render(<Controlled />);
    const combobox = screen.getByRole('combobox', { name: /Experience Level/ });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveTextContent('Select');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('uses a custom placeholder', () => {
    render(<Controlled placeholder="Select Document Type" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Select Document Type');
  });

  it('opens on click and selects an option with the mouse', async () => {
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);

    await userEvent.click(screen.getByRole('option', { name: '6–10' }));
    expect(onChange).toHaveBeenCalledWith('6-10');
    expect(screen.getByRole('combobox')).toHaveTextContent('6–10');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('is operable with the keyboard', async () => {
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.tab();
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: '0–2' }).id);

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(combobox).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: '6–10' }).id,
    );

    await userEvent.keyboard('{End}');
    expect(combobox).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: '10+' }).id);

    await userEvent.keyboard('{Home}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('0-2');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens on the selected option and marks it aria-selected', async () => {
    render(<Controlled initial="3-5" />);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    const option = screen.getByRole('option', { name: '3–5' });
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', option.id);
  });

  it('closes on Escape without changing the value', async () => {
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes when clicking outside', async () => {
    render(
      <>
        <Controlled />
        <p>outside</p>
      </>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('outside'));
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('links the error message and marks the combobox invalid', () => {
    render(<Controlled error="Select your experience level" />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox).toHaveAccessibleDescription('Select your experience level');
  });

  it('works with react-hook-form through Controller', async () => {
    const onSubmit = jest.fn();
    function Form() {
      const { control, handleSubmit } = useForm({ defaultValues: { experience: '' } });
      return (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="experience"
            control={control}
            render={({ field }) => (
              <Select
                label="Experience Level"
                options={OPTIONS}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
          <button type="submit">Save</button>
        </form>
      );
    }
    render(<Form />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: '10+' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit.mock.calls[0][0]).toEqual({ experience: '10+' });
  });
});

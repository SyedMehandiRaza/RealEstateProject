import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs from '../Tabs.jsx';

const TABS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'developer', label: 'Developers' },
];

function Controlled({ initial = 'buyer', onChange = () => {} }) {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      label="Account type"
      tabs={TABS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('Tabs', () => {
  it('renders a labelled tablist with the selected tab', () => {
    render(<Controlled />);
    expect(screen.getByRole('tablist', { name: 'Account type' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Buyer' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'false');
  });

  it('selects a tab on click', async () => {
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Developers' }));
    expect(onChange).toHaveBeenCalledWith('developer');
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'true');
  });

  it('only the selected tab is in the tab order', async () => {
    render(<Controlled />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Buyer' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves and selects with arrow keys, wrapping, and Home/End', async () => {
    render(<Controlled />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Buyer' })).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Buyer' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Developers' })).toHaveAttribute('aria-selected', 'true');
  });
});

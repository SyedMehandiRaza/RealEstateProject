import { render, screen } from '@testing-library/react';
import { DOCUMENT_STATUSES } from '@real-estate/shared';
import StatusBadge from '../StatusBadge.jsx';

describe('StatusBadge', () => {
  it.each([
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['rejected', 'Reject'],
  ])('shows %s as "%s" with a decorative dot', (status, label) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('covers every shared document status', () => {
    for (const status of DOCUMENT_STATUSES) {
      expect(() => render(<StatusBadge status={status} />)).not.toThrow();
    }
  });

  it('rejects an unknown status', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<StatusBadge status="unknown" />)).toThrow('unknown status');
    console.error.mockRestore();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadedFileCard from '../UploadedFileCard.jsx';
import { formatFileSize } from '../formatFileSize.js';

const SIZE_4_54_MB = Math.round(4.54 * 1024 * 1024);

describe('formatFileSize', () => {
  it('formats bytes as in Figma ("4.54 mb")', () => {
    expect(formatFileSize(SIZE_4_54_MB)).toBe('4.54 mb');
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.00 mb');
  });
});

describe('UploadedFileCard', () => {
  it('shows the file name, size and a decorative thumbnail', () => {
    const { container } = render(
      <UploadedFileCard name="License_Certificate.pdf" size={SIZE_4_54_MB} thumbnail="thumb.png" />,
    );
    expect(screen.getByText('License_Certificate.pdf')).toBeInTheDocument();
    expect(screen.getByText('Size: 4.54 mb')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it.each([undefined, null, Number.NaN])('hides the size line when size is %s', (size) => {
    render(<UploadedFileCard name="Profile Photo" size={size} status="pending" />);
    expect(screen.getByText('Profile Photo')).toBeInTheDocument();
    expect(screen.queryByText(/^Size:/)).not.toBeInTheDocument();
  });

  it('shows a size of 0 bytes', () => {
    render(<UploadedFileCard name="empty.pdf" size={0} />);
    expect(screen.getByText('Size: 0.00 mb')).toBeInTheDocument();
  });

  it('renders a blank tile when there is no thumbnail', () => {
    const { container } = render(<UploadedFileCard name="a.pdf" size={1} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('calls onRemove from a labelled remove button', async () => {
    const onRemove = jest.fn();
    render(<UploadedFileCard name="Profile.png" size={SIZE_4_54_MB} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Profile.png' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('shows a status badge instead of the remove button', () => {
    render(<UploadedFileCard name="Profile.png" size={SIZE_4_54_MB} status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

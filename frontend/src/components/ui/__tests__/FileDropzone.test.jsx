import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropzone from '../FileDropzone.jsx';

function makeFile(name = 'id.pdf', type = 'application/pdf') {
  return new File(['%PDF'], name, { type });
}

function drop(target, files) {
  const event = createEvent.drop(target);
  Object.defineProperty(event, 'dataTransfer', { value: { files, dropEffect: 'none' } });
  fireEvent(target, event);
  return event;
}

describe('FileDropzone', () => {
  it('shows the default copy from Figma', () => {
    render(<FileDropzone />);
    expect(screen.getByText('Drag & drop OR click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: PDF, JPG, PNG')).toBeInTheDocument();
    expect(screen.getByText('Max size: 10 MB')).toBeInTheDocument();
  });

  it('accepts per-slot copy', () => {
    render(<FileDropzone formatsText="Supported formats: JPG, PNG" />);
    expect(screen.getByText('Supported formats: JPG, PNG')).toBeInTheDocument();
  });

  it('exposes a labelled file input that receives the accept list', () => {
    render(<FileDropzone accept=".pdf,.jpg,.png" />);
    const input = screen.getByLabelText(/Drag & drop OR click to browse/);
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', '.pdf,.jpg,.png');
  });

  it('passes a file chosen by click to onFileSelect', async () => {
    const onFileSelect = jest.fn();
    render(<FileDropzone onFileSelect={onFileSelect} aria-label="Government ID file" />);
    const file = makeFile();
    await userEvent.upload(screen.getByLabelText('Government ID file'), file);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('is keyboard reachable', async () => {
    render(<FileDropzone aria-label="Profile Photo file" />);
    await userEvent.tab();
    expect(screen.getByLabelText('Profile Photo file')).toHaveFocus();
  });

  it('passes a dropped file to onFileSelect and prevents the browser from opening it', () => {
    const onFileSelect = jest.fn();
    render(<FileDropzone onFileSelect={onFileSelect} />);
    const zone = screen.getByText('Drag & drop OR click to browse').closest('label');
    const file = makeFile('photo.png', 'image/png');
    const event = drop(zone, [file]);
    expect(onFileSelect).toHaveBeenCalledWith(file);
    expect(event.defaultPrevented).toBe(true);
  });

  it('ignores drops while disabled', () => {
    const onFileSelect = jest.fn();
    render(<FileDropzone onFileSelect={onFileSelect} disabled />);
    const zone = screen.getByText('Drag & drop OR click to browse').closest('label');
    drop(zone, [makeFile()]);
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('links the error message to the input', () => {
    render(<FileDropzone aria-label="Government ID file" error="File must be 10 MB or smaller" />);
    const input = screen.getByLabelText('Government ID file');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('File must be 10 MB or smaller');
  });
});

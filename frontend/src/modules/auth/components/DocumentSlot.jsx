import { useId } from 'react';
import FileDropzone from '../../../components/ui/FileDropzone.jsx';
import Select from '../../../components/ui/Select.jsx';
import UploadedFileCard from '../../../components/ui/UploadedFileCard.jsx';
import styles from './DocumentSlot.module.css';

// One required document on Upload Document (Figma 13038:4594 / 13038:4605 / 13038:4619) and its
// Uploaded state (13038:4903 / 13038:4921 / 13038:4939): the label, the Government ID type Select when
// `typeSelect` is given, then a FileDropzone until a file is picked and an UploadedFileCard (x) after.
// `fileError` shows under the dropzone, or under the card for a server error on a picked file.
export default function DocumentSlot({
  label,
  formatsText,
  accept,
  file,
  thumbnail,
  fileError,
  onFileSelect,
  onRemove,
  typeSelect,
}) {
  const id = useId();
  const labelId = typeSelect ? `${id}-type-label` : `${id}-label`;
  const errorId = `${id}-error`;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={file && fileError ? errorId : undefined}
      className={styles.slot}
    >
      {typeSelect ? (
        <Select
          id={`${id}-type`}
          label={label}
          placeholder="Select Document Type"
          options={typeSelect.options}
          value={typeSelect.value}
          onChange={typeSelect.onChange}
          error={typeSelect.error}
        />
      ) : (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      {file ? (
        <>
          <UploadedFileCard name={file.name} size={file.size} thumbnail={thumbnail} onRemove={onRemove} />
          {fileError && (
            <p id={errorId} className={styles.error}>
              {fileError}
            </p>
          )}
        </>
      ) : (
        <FileDropzone
          aria-label={`${label} file`}
          accept={accept}
          formatsText={formatsText}
          error={fileError}
          onFileSelect={onFileSelect}
        />
      )}
    </div>
  );
}

// "Size: 4.54 mb" as in Figma (Uploaded 13038:4918): megabytes (1024 x 1024 bytes), two decimals,
// lower-case unit.
export function formatFileSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} mb`;
}

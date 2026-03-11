/**
 * Result of a document format conversion.
 *
 * All conversion functions return this interface with the converted content
 * and metadata about the source/target formats and sizes (in bytes).
 */
export interface ConversionResult {
  /** The converted content string. */
  content: string;
  /** Source format identifier (e.g. "markdown", "html", "csv", "json", "text"). */
  sourceFormat: string;
  /** Target format identifier (e.g. "html", "text", "json", "csv", "yaml", "markdown"). */
  targetFormat: string;
  /** Byte size of the source input (UTF-8 encoded). */
  sourceSize: number;
  /** Byte size of the converted output (UTF-8 encoded). */
  targetSize: number;
}

/**
 * Structured table data parsed from CSV or similar tabular sources.
 */
export interface TableData {
  /** Column header names from the first row. */
  headers: string[];
  /** Data rows (each row is an array of cell values). */
  rows: string[][];
  /** Number of data rows (excluding the header). */
  rowCount: number;
  /** Number of columns. */
  columnCount: number;
}

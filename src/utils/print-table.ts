/**
 * Smart table printing utility
 * Automatically calculates column widths and handles text wrapping
 */

export enum ColumnAlign {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
}

export interface TableColumn<K extends string = string> {
  /** Key in the data object */
  key: K;
  /** Optional header text (defaults to key) */
  header?: string;
  /** Column alignment (default: LEFT, frozen columns default to RIGHT) */
  align?: ColumnAlign;
  /** If true, this column will not wrap and maintains its content width */
  frozen?: boolean;
  /** Minimum width for the column */
  minWidth?: number;
  /** Maximum width for the column (only applies to non-frozen) */
  maxWidth?: number;
}

export interface PrintTableOptions {
  /** Printer width: '58mm' (32 chars) or '80mm' (48 chars). Default: '80mm' */
  printerWidth?: '58mm' | '80mm';
  /** Show header row. Default: false */
  showHeader?: boolean;
  /** Column separator. Default: ' ' */
  separator?: string;
  /** Add separator line after header. Default: false */
  headerLine?: boolean;
  /** Character for header line. Default: '-' */
  headerLineChar?: string;
}

const PRINTER_CHARS = {
  '58mm': 32,
  '80mm': 48,
};

/**
 * Get the display width of a string (handles some unicode)
 */
const getStringWidth = (str: string): number => {
  return str.length;
};

/**
 * Pad string to specified width with alignment
 */
const padString = (str: string, width: number, align: ColumnAlign): string => {
  const strWidth = getStringWidth(str);
  if (strWidth >= width) return str.slice(0, width);
  
  const padding = width - strWidth;
  
  switch (align) {
    case ColumnAlign.LEFT:
      return str + ' '.repeat(padding);
    case ColumnAlign.CENTER:
      const left = Math.floor(padding / 2);
      const right = Math.ceil(padding / 2);
      return ' '.repeat(left) + str + ' '.repeat(right);
    case ColumnAlign.RIGHT:
      return ' '.repeat(padding) + str;
    default:
      return str + ' '.repeat(padding);
  }
};

/**
 * Wrap text to fit within maxWidth, trying to break at spaces
 */
const wrapText = (text: string, maxWidth: number): string[] => {
  if (getStringWidth(text) <= maxWidth) return [text];
  
  const lines: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxWidth) {
      lines.push(remaining);
      break;
    }
    
    // Try to find a space to break at
    let breakPoint = maxWidth;
    const lastSpace = remaining.slice(0, maxWidth).lastIndexOf(' ');
    
    if (lastSpace > 0) {
      breakPoint = lastSpace;
    }
    
    lines.push(remaining.slice(0, breakPoint).trim());
    remaining = remaining.slice(breakPoint).trim();
  }
  
  return lines;
};

/**
 * Calculate column widths automatically
 */
const calculateColumnWidths = (
  data: Record<string, string>[],
  columns: TableColumn[],
  totalWidth: number,
  separator: string,
  showHeader: boolean
): number[] => {
  const separatorWidth = separator.length;
  const totalSeparatorWidth = separatorWidth * (columns.length - 1);
  const availableWidth = totalWidth - totalSeparatorWidth;
  
  // Calculate frozen column widths (based on max content)
  const frozenWidths: (number | null)[] = columns.map((col) => {
    if (!col.frozen) return null;
    
    let maxWidth = col.minWidth || 0;
    
    // Check header width
    if (showHeader) {
      const headerText = col.header || col.key;
      maxWidth = Math.max(maxWidth, getStringWidth(headerText));
    }
    
    // Check data width
    data.forEach(row => {
      const value = row[col.key] || '';
      maxWidth = Math.max(maxWidth, getStringWidth(value));
    });
    
    return maxWidth;
  });
  
  // Calculate total frozen width
  const totalFrozenWidth = frozenWidths.reduce<number>((sum, w) => sum + (w || 0), 0);
  
  // Calculate flexible column widths
  const flexibleColumns = columns.filter(col => !col.frozen);
  const remainingWidth = availableWidth - totalFrozenWidth;
  
  if (flexibleColumns.length === 0) {
    return frozenWidths as number[];
  }
  
  // Distribute remaining width among flexible columns
  const baseFlexWidth = Math.floor(remainingWidth / flexibleColumns.length);
  
  const widths: number[] = columns.map((col, idx) => {
    if (col.frozen) {
      return frozenWidths[idx] as number;
    }
    
    let width = baseFlexWidth;
    
    // Apply min/max constraints
    if (col.minWidth && width < col.minWidth) {
      width = col.minWidth;
    }
    if (col.maxWidth && width > col.maxWidth) {
      width = col.maxWidth;
    }
    
    return Math.max(1, width); // Ensure at least 1 char width
  });
  
  return widths;
};

/**
 * Process a single row of data into formatted lines
 */
const processRow = (
  row: Record<string, string>,
  columns: TableColumn[],
  widths: number[],
  separator: string
): string[] => {
  // Get wrapped lines for each column
  const columnLines: string[][] = columns.map((col, idx) => {
    const value = row[col.key] || '';
    const width = widths[idx];
    
    if (col.frozen) {
      // Frozen columns don't wrap, just truncate if needed
      return [value.slice(0, width)];
    }
    
    return wrapText(value, width);
  });
  
  // Find max lines needed
  const maxLines = Math.max(...columnLines.map(lines => lines.length));
  
  // Build output lines
  const outputLines: string[] = [];
  
  for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
    const lineParts = columns.map((col, colIdx) => {
      const lines = columnLines[colIdx];
      const text = lines[lineIdx] || '';
      const width = widths[colIdx];
      const align = col.align ?? (col.frozen ? ColumnAlign.RIGHT : ColumnAlign.LEFT);
      
      return padString(text, width, align);
    });
    
    outputLines.push(lineParts.join(separator));
  }
  
  return outputLines;
};

/**
 * Generate formatted table text from data
 */
export const generateTableText = <T extends Record<string, string>>(
  data: T[],
  columns: TableColumn<keyof T & string>[],
  options: PrintTableOptions = {}
): string => {
  const {
    printerWidth = '80mm',
    showHeader = false,
    separator = ' ',
    headerLine = false,
    headerLineChar = '-',
  } = options;
  
  const totalWidth = PRINTER_CHARS[printerWidth];
  const widths = calculateColumnWidths(data, columns, totalWidth, separator, showHeader);
  
  const lines: string[] = [];
  
  // Add header if requested
  if (showHeader) {
    const headerRow: Record<string, string> = {};
    columns.forEach(col => {
      headerRow[col.key] = col.header || col.key;
    });
    
    const headerLines = processRow(headerRow, columns, widths, separator);
    lines.push(...headerLines);
    
    // Add header separator line
    if (headerLine) {
      lines.push(headerLineChar.repeat(totalWidth));
    }
  }
  
  // Process data rows
  data.forEach(row => {
    const rowLines = processRow(row, columns, widths, separator);
    lines.push(...rowLines);
  });
  
  return lines.join('\n');
};

/**
 * Helper to create a simple two-column receipt layout
 * @param items - Array of {label, value} items
 * @param options - Print options
 */
export const generateReceiptText = (
  items: { label: string; value: string }[],
  options: PrintTableOptions = {}
): string => {
  const data = items.map(item => ({
    label: item.label,
    value: item.value,
  }));
  
  const columns: TableColumn<'label' | 'value'>[] = [
    { key: 'label', align: ColumnAlign.LEFT, frozen: false },
    { key: 'value', align: ColumnAlign.RIGHT, frozen: true },
  ];
  
  return generateTableText(data, columns, options);
};

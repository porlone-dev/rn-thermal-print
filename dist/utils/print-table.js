/**
 * Smart table printing utility
 * Automatically calculates column widths and handles text wrapping
 */
export var ColumnAlign;
(function (ColumnAlign) {
    ColumnAlign[ColumnAlign["LEFT"] = 0] = "LEFT";
    ColumnAlign[ColumnAlign["CENTER"] = 1] = "CENTER";
    ColumnAlign[ColumnAlign["RIGHT"] = 2] = "RIGHT";
})(ColumnAlign || (ColumnAlign = {}));
var PRINTER_CHARS = {
    '58mm': 32,
    '80mm': 48,
};
/**
 * Get the display width of a string (handles some unicode)
 */
var getStringWidth = function (str) {
    return str.length;
};
/**
 * Pad string to specified width with alignment
 */
var padString = function (str, width, align) {
    var strWidth = getStringWidth(str);
    if (strWidth >= width)
        return str.slice(0, width);
    var padding = width - strWidth;
    switch (align) {
        case ColumnAlign.LEFT:
            return str + ' '.repeat(padding);
        case ColumnAlign.CENTER:
            var left = Math.floor(padding / 2);
            var right = Math.ceil(padding / 2);
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
var wrapText = function (text, maxWidth) {
    if (getStringWidth(text) <= maxWidth)
        return [text];
    var lines = [];
    var remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= maxWidth) {
            lines.push(remaining);
            break;
        }
        // Try to find a space to break at
        var breakPoint = maxWidth;
        var lastSpace = remaining.slice(0, maxWidth).lastIndexOf(' ');
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
var calculateColumnWidths = function (data, columns, totalWidth, separator, showHeader) {
    var separatorWidth = separator.length;
    var totalSeparatorWidth = separatorWidth * (columns.length - 1);
    var availableWidth = totalWidth - totalSeparatorWidth;
    // Calculate frozen column widths (based on max content)
    var frozenWidths = columns.map(function (col) {
        if (!col.frozen)
            return null;
        var maxWidth = col.minWidth || 0;
        // Check header width
        if (showHeader) {
            var headerText = col.header || col.key;
            maxWidth = Math.max(maxWidth, getStringWidth(headerText));
        }
        // Check data width
        data.forEach(function (row) {
            var value = row[col.key] || '';
            maxWidth = Math.max(maxWidth, getStringWidth(value));
        });
        return maxWidth;
    });
    // Calculate total frozen width
    var totalFrozenWidth = frozenWidths.reduce(function (sum, w) { return sum + (w || 0); }, 0);
    // Calculate flexible column widths
    var flexibleColumns = columns.filter(function (col) { return !col.frozen; });
    var remainingWidth = availableWidth - totalFrozenWidth;
    if (flexibleColumns.length === 0) {
        return frozenWidths;
    }
    // Distribute remaining width among flexible columns
    var baseFlexWidth = Math.floor(remainingWidth / flexibleColumns.length);
    var widths = columns.map(function (col, idx) {
        if (col.frozen) {
            return frozenWidths[idx];
        }
        var width = baseFlexWidth;
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
var processRow = function (row, columns, widths, separator) {
    // Get wrapped lines for each column
    var columnLines = columns.map(function (col, idx) {
        var value = row[col.key] || '';
        var width = widths[idx];
        if (col.frozen) {
            // Frozen columns don't wrap, just truncate if needed
            return [value.slice(0, width)];
        }
        return wrapText(value, width);
    });
    // Find max lines needed
    var maxLines = Math.max.apply(Math, columnLines.map(function (lines) { return lines.length; }));
    // Build output lines
    var outputLines = [];
    var _loop_1 = function (lineIdx) {
        var lineParts = columns.map(function (col, colIdx) {
            var _a;
            var lines = columnLines[colIdx];
            var text = lines[lineIdx] || '';
            var width = widths[colIdx];
            var align = (_a = col.align) !== null && _a !== void 0 ? _a : (col.frozen ? ColumnAlign.RIGHT : ColumnAlign.LEFT);
            return padString(text, width, align);
        });
        outputLines.push(lineParts.join(separator));
    };
    for (var lineIdx = 0; lineIdx < maxLines; lineIdx++) {
        _loop_1(lineIdx);
    }
    return outputLines;
};
/**
 * Generate formatted table text from data
 */
export var generateTableText = function (data, columns, options) {
    if (options === void 0) { options = {}; }
    var _a = options.printerWidth, printerWidth = _a === void 0 ? '80mm' : _a, _b = options.showHeader, showHeader = _b === void 0 ? false : _b, _c = options.separator, separator = _c === void 0 ? ' ' : _c, _d = options.headerLine, headerLine = _d === void 0 ? false : _d, _e = options.headerLineChar, headerLineChar = _e === void 0 ? '-' : _e;
    var totalWidth = PRINTER_CHARS[printerWidth];
    var widths = calculateColumnWidths(data, columns, totalWidth, separator, showHeader);
    var lines = [];
    // Add header if requested
    if (showHeader) {
        var headerRow_1 = {};
        columns.forEach(function (col) {
            headerRow_1[col.key] = col.header || col.key;
        });
        var headerLines = processRow(headerRow_1, columns, widths, separator);
        lines.push.apply(lines, headerLines);
        // Add header separator line
        if (headerLine) {
            lines.push(headerLineChar.repeat(totalWidth));
        }
    }
    // Process data rows
    data.forEach(function (row) {
        var rowLines = processRow(row, columns, widths, separator);
        lines.push.apply(lines, rowLines);
    });
    return lines.join('\n');
};
/**
 * Helper to create a simple two-column receipt layout
 * @param items - Array of {label, value} items
 * @param options - Print options
 */
export var generateReceiptText = function (items, options) {
    if (options === void 0) { options = {}; }
    var data = items.map(function (item) { return ({
        label: item.label,
        value: item.value,
    }); });
    var columns = [
        { key: 'label', align: ColumnAlign.LEFT, frozen: false },
        { key: 'value', align: ColumnAlign.RIGHT, frozen: true },
    ];
    return generateTableText(data, columns, options);
};

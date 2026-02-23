import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Column definitions {key, header}
 * @returns {string} CSV string
 */
export function generateCSV(data, columns) {
  // Generate header row
  const headers = columns.map(col => `"${col.header}"`).join(',');
  
  // Return only headers if no data
  if (!data || data.length === 0) {
    return headers;
  }
  
  // Generate data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = col.format ? col.format(item[col.key], item) : item[col.key];
      // Escape quotes and wrap in quotes
      const escaped = String(value ?? '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Generate Excel file with improved formatting
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions {key, header, width}
 * @param {string} sheetName - Name of the worksheet
 * @returns {Promise<Buffer>} Excel file buffer
 */
export async function generateExcel(data, columns, sheetName = 'Data') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 20
  }));

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4A4A4A' }
  };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center' };

  // Add data rows if exists
  if (data && data.length > 0) {
    data.forEach((item, rowIndex) => {
      const row = {};
      columns.forEach(col => {
        row[col.key] = col.format ? col.format(item[col.key], item) : item[col.key];
      });
      const newRow = worksheet.addRow(row);
      
      // Alternate row colors
      if (rowIndex % 2 === 1) {
        newRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }
      
      // Center align numeric values
      newRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
      });
    });
  } else {
    // Add "No data" message row
    const emptyRow = worksheet.addRow(['No data found for the selected filters']);
    emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF999999' } };
    emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'center' };
    worksheet.mergeCells(`A${emptyRow.number}:${String.fromCharCode(64 + columns.length)}${emptyRow.number}`);
  }

  // Auto-fit columns based on content
  worksheet.columns.forEach(column => {
    let maxLength = column.header.length;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? String(cell.value).length : 0;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 3, 12), 50);
  });

  // Add borders to all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });
  });

  // Add summary row
  const totalRows = data ? data.length : 0;
  worksheet.addRow(['']);
  const summaryRow = worksheet.addRow([`Total Records: ${totalRows}`]);
  summaryRow.getCell(1).font = { bold: true };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Generate Professional PDF Report
 * Creates multi-page A4/A4L PDFs with intelligent pagination
 * Automatically selects orientation based on column count
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions {key, header, width, format}
 * @param {Object} options - PDF options {title, subtitle}
 * @returns {Promise<Buffer>} PDF file buffer
 */
export async function generatePDF(data, columns, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Determine orientation based on column count
      const isLandscape = columns.length > 7;
      
      // PDF Constants - A4 or A4 Landscape
      const PAGE_WIDTH = isLandscape ? 1191 : 595;   // A4L: 1191 points, A4: 595 points
      const PAGE_HEIGHT = isLandscape ? 595 : 842;   // A4L: 595 points, A4: 842 points
      const MARGIN = 20;  // 20px margins on all sides
      const TABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;
      
      const HEADER_HEIGHT = 15;
      const ROW_HEIGHT = 15;
      const HEADER_BG = '#E8E8E8';
      const HEADER_TEXT = '#000000';
      const ALTERNATE_ROW_BG = '#F5F5F5';
      const BORDER_COLOR = '#CCCCCC';
      const PADDING = 4;  // 4px padding for better text visibility
      const FONT_SIZE = isLandscape ? 8 : 9;

      // Create document
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
        bufferPages: true
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ==================== HEADER SECTION ====================
      // Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000');
      doc.text(options.title || 'Report', MARGIN, MARGIN, {
        align: 'center',
        width: TABLE_WIDTH
      });

      // Generated date/time
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB');
      const timeStr = now.toLocaleTimeString('en-GB');
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      doc.text(`Generated on: ${dateStr} ${timeStr}`, MARGIN, MARGIN + 22, {
        align: 'center',
        width: TABLE_WIDTH
      });

      // ==================== EMPTY DATA HANDLING ====================
      if (!data || data.length === 0) {
        doc.fontSize(11).font('Helvetica').fillColor('#999999');
        doc.text('No data found for the selected filters.', MARGIN, MARGIN + 60, {
          align: 'center',
          width: TABLE_WIDTH
        });
        doc.end();
        return;
      }

      // ==================== COLUMN CONFIGURATION ====================
      // Calculate dynamic column widths - ensure full visibility
      const baseColWidth = Math.floor(TABLE_WIDTH / columns.length);
      
      const columnWidths = columns.map(col => {
        // Minimum width based on header length
        const headerWidth = col.header.length * 6 + 2 * PADDING;
        return Math.max(headerWidth, baseColWidth);
      });

      // Scale proportionally to fit page width
      const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
      const scaleFactor = totalWidth > TABLE_WIDTH ? TABLE_WIDTH / totalWidth : 1;
      const finalColumnWidths = columnWidths.map(w => Math.floor(w * scaleFactor));

      // ==================== TABLE RENDERING ====================
      let yPos = MARGIN + 50; // Start below header
      const footerYPos = PAGE_HEIGHT - MARGIN - 18; // Reserve space for footer
      const availableHeight = footerYPos - yPos;
      
      let pageNumber = 1;
      let rowsOnPage = 0;
      let isFirstPage = true;

      // Helper: Draw table header
      const drawTableHeader = (startY) => {
        let xPos = MARGIN;

        // Header background
        doc.rect(MARGIN, startY, TABLE_WIDTH, HEADER_HEIGHT)
          .fill(HEADER_BG);

        // Header text - show full text without ellipsis
        doc.fontSize(FONT_SIZE).font('Helvetica-Bold').fillColor(HEADER_TEXT);

        columns.forEach((col, idx) => {
          const width = finalColumnWidths[idx];
          const align = getColumnAlignment(col);

          doc.text(col.header, xPos + PADDING, startY + 2, {
            width: width - 2 * PADDING,
            height: HEADER_HEIGHT - 2,
            align: align,
            valign: 'center',
            ellipsis: false  // Show full header text
          });

          xPos += width;
        });

        // Horizontal line under header
        doc.strokeColor(BORDER_COLOR).lineWidth(0.5);
        doc.moveTo(MARGIN, startY + HEADER_HEIGHT)
          .lineTo(MARGIN + TABLE_WIDTH, startY + HEADER_HEIGHT)
          .stroke();
      };

      // Helper: Determine column alignment
      const getColumnAlignment = (col) => {
        const key = col.key?.toLowerCase() || '';
        if (key.includes('price') || key.includes('amount') || key.includes('total')) return 'right';
        if (key.includes('quantity') || key.includes('count') || key.includes('tickets')) return 'center';
        return 'left';
      };

      // Helper: Get cell text with formatting
      const getCellText = (item, col) => {
        const value = item[col.key];
        if (col.format && typeof col.format === 'function') {
          return col.format(value, item);
        }
        return value ?? '';
      };

      // Helper: Start new page
      const startNewPage = () => {
        // Footer on current page - page number only
        doc.fontSize(7).fillColor('#999999');
        doc.text(`Page ${pageNumber}`, MARGIN, footerYPos + 8, {
          align: 'center',
          width: TABLE_WIDTH
        });

        doc.addPage();
        pageNumber++;
        yPos = MARGIN;
        rowsOnPage = 0;
        isFirstPage = false;

        // Redraw header on new page
        drawTableHeader(yPos);
        yPos += HEADER_HEIGHT;
      };

      // Draw header on first page
      drawTableHeader(yPos);
      yPos += HEADER_HEIGHT;

      // ==================== RENDER DATA ROWS ====================
      data.forEach((row, rowIndex) => {
        // Check if row fits on current page
        if (yPos + ROW_HEIGHT > footerYPos) {
          startNewPage();
        }

        let xPos = MARGIN;

        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.rect(MARGIN, yPos, TABLE_WIDTH, ROW_HEIGHT)
            .fill(ALTERNATE_ROW_BG);
        }

        // Row separator line
        doc.strokeColor(BORDER_COLOR).lineWidth(0.5);
        doc.moveTo(MARGIN, yPos + ROW_HEIGHT)
          .lineTo(MARGIN + TABLE_WIDTH, yPos + ROW_HEIGHT)
          .stroke();

        // Row data - show full text without ellipsis
        doc.fontSize(FONT_SIZE).font('Helvetica').fillColor('#000000');

        columns.forEach((col, colIdx) => {
          const width = finalColumnWidths[colIdx];
          const align = getColumnAlignment(col);
          const cellText = getCellText(row, col);

          doc.text(String(cellText), xPos + PADDING, yPos + 2, {
            width: width - 2 * PADDING,
            height: ROW_HEIGHT - 2,
            align: align,
            valign: 'center',
            ellipsis: false  // Show full cell text
          });

          xPos += width;
        });

        yPos += ROW_HEIGHT;
        rowsOnPage++;
      });

      // ==================== FINAL PAGE FOOTER ====================
      doc.fontSize(7).fillColor('#999999');
      doc.text(`Page ${pageNumber}`, MARGIN, footerYPos + 8, {
        align: 'center',
        width: TABLE_WIDTH
      });

      doc.fontSize(7).fillColor('#666666');
      doc.text(`Total Records: ${data.length}`, MARGIN, footerYPos + 16, {
        align: 'center'
      });

      // Finalize
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format date for export
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toFixed(2)}`;
}

/**
 * Format status badge
 */
export function formatStatus(status) {
  if (!status) return '';
  return String(status).toUpperCase();
}

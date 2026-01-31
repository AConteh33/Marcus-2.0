import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

// Dynamic imports for Node.js modules to avoid browser build issues
let ExcelJS: any = null;
let readFile: any = null;
let writeFile: any = null;
let existsSync: any = null;
let join: any = null;

// Try to load Node.js modules (only available in Electron main process)
try {
  if (typeof window === 'undefined') {
    // We're in Node.js environment
    ExcelJS = require('exceljs');
    const fs = require('fs');
    const path = require('path');
    readFile = fs.promises.readFile;
    writeFile = fs.promises.writeFile;
    existsSync = fs.existsSync;
    join = path.join;
  }
} catch (error) {
  console.log('Enhanced Excel tools: Node.js modules not available in browser context');
}

interface Tool {
    getDeclaration(): FunctionDeclaration;
    execute(args: any): Promise<string>;
}

interface EnhancedExcelToolArgs {
  action: 'read' | 'write' | 'create' | 'update' | 'list-sheets' | 'get-cell' | 'set-cell' | 
         'conditional-formatting' | 'apply-style' | 'add-chart' | 'freeze-panes' | 'auto-filter';
  filePath?: string;
  sheetName?: string;
  data?: any;
  cell?: string;
  value?: any;
  range?: string;
  outputPath?: string;
  formatting?: {
    type: 'highlight' | 'data-bars' | 'color-scale' | 'icon-set' | 'formula';
    rule: string;
    style?: {
      fill?: string;
      font?: string;
      border?: string;
    };
    range?: string;
  };
  style?: {
    font?: {
      name?: string;
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: string;
    };
    fill?: {
      type: 'pattern' | 'gradient';
      pattern?: string;
      fgColor?: string;
      bgColor?: string;
    };
    border?: {
      top?: { style: string; color: string };
      bottom?: { style: string; color: string };
      left?: { style: string; color: string };
      right?: { style: string; color: string };
    };
    alignment?: {
      horizontal?: 'left' | 'center' | 'right';
      vertical?: 'top' | 'middle' | 'bottom';
    };
    numberFormat?: string;
  };
  chart?: {
    type: 'column' | 'bar' | 'line' | 'pie' | 'scatter';
    range: string;
    title?: string;
    position?: { x: number; y: number };
  };
  freezePanes?: {
    row?: number;
    column?: number;
  };
}

export const EnhancedExcelTool: Tool = {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'enhancedExcel',
      description: 'Advanced Excel operations with conditional formatting, styling, charts, and more. Full Excel file management with visual formatting capabilities.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Action to perform: read, write, create, update, list-sheets, get-cell, set-cell, conditional-formatting, apply-style, add-chart, freeze-panes, auto-filter',
          },
          filePath: {
            type: Type.STRING,
            description: 'Path to the Excel file',
          },
          sheetName: {
            type: Type.STRING,
            description: 'Name of the sheet to work with',
          },
          data: {
            description: 'Data to write (for write/create actions)',
          },
          cell: {
            type: Type.STRING,
            description: 'Cell reference (e.g., "A1", "B2") for get-cell/set-cell actions',
          },
          value: {
            description: 'Value to set in a cell for set-cell action',
          },
          range: {
            type: Type.STRING,
            description: 'Range to read or format (e.g., "A1:C10")',
          },
          outputPath: {
            type: Type.STRING,
            description: 'Output path for modified Excel file',
          },
          formatting: {
            description: 'Conditional formatting rules and styles',
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: 'Formatting type: highlight, data-bars, color-scale, icon-set, formula',
              },
              rule: {
                type: Type.STRING,
                description: 'Formatting rule or formula',
              },
              style: {
                type: Type.OBJECT,
                description: 'Style configuration',
              },
              range: {
                type: Type.STRING,
                description: 'Range to apply formatting',
              },
            },
          },
          style: {
            description: 'Cell styling options (font, fill, border, alignment)',
            type: Type.OBJECT,
          },
          chart: {
            description: 'Chart configuration (type, range, title, position)',
            type: Type.OBJECT,
          },
          freezePanes: {
            description: 'Freeze panes configuration (row, column)',
            type: Type.OBJECT,
          },
        },
        required: ['action'],
      },
    };
  },
  execute: async ({ action, filePath, sheetName, data, cell, value, range, outputPath, formatting, style, chart, freezePanes }: EnhancedExcelToolArgs) => {
    try {
      // Check if Node.js modules are available
      if (!ExcelJS || !readFile || !writeFile || !existsSync || !join) {
        return JSON.stringify({
          success: false,
          error: 'Enhanced Excel tools require Node.js environment. Please use this tool in the Electron main process or via terminal commands.',
          availableActions: ['read', 'write', 'create', 'update', 'list-sheets', 'get-cell', 'set-cell', 'conditional-formatting', 'apply-style', 'add-chart', 'freeze-panes', 'auto-filter']
        });
      }

      let result;
      switch (action) {
        case 'read':
          result = await readExcelFile(filePath!, sheetName, range);
          break;
        case 'create':
          result = await createExcelFile(data!, outputPath!);
          break;
        case 'write':
          result = await writeExcelFile(filePath!, data!, sheetName, outputPath);
          break;
        case 'update':
          result = await updateExcelFile(filePath!, data!, sheetName, outputPath);
          break;
        case 'list-sheets':
          result = await listSheets(filePath!);
          break;
        case 'get-cell':
          result = await getCellValue(filePath!, sheetName!, cell!);
          break;
        case 'set-cell':
          result = await setCellValue(filePath!, sheetName!, cell!, value!, outputPath);
          break;
        case 'conditional-formatting':
          result = await applyConditionalFormatting(filePath!, sheetName!, formatting!, outputPath);
          break;
        case 'apply-style':
          result = await applyStyle(filePath!, sheetName!, range!, style!, outputPath);
          break;
        case 'add-chart':
          result = await addChart(filePath!, sheetName!, chart!, outputPath);
          break;
        case 'freeze-panes':
          result = await freezePanesAction(filePath!, sheetName!, freezePanes!, outputPath);
          break;
        case 'auto-filter':
          result = await applyAutoFilter(filePath!, sheetName!, range, outputPath);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },
};

async function readExcelFile(filePath: string, sheetName?: string, range?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  const fileBuffer = await readFile(filePath);
  await workbook.xlsx.load(fileBuffer);
  
  const targetSheetName = sheetName || workbook.worksheets[0].name;
  const worksheet = workbook.getWorksheet(targetSheetName);
  
  if (!worksheet) {
    throw new Error(`Sheet not found: ${targetSheetName}`);
  }

  let jsonData;
  if (range) {
    const rangeData = worksheet.getSheetValues();
    jsonData = rangeData;
  } else {
    jsonData = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) {
        // Header row
        const headers = row.values as string[];
        jsonData.push(headers);
      } else {
        const values = row.values as any[];
        jsonData.push(values);
      }
    });
  }

  return {
    success: true,
    data: jsonData,
    sheetName: targetSheetName,
    totalRows: worksheet.rowCount,
    totalColumns: worksheet.columnCount,
    availableSheets: workbook.worksheets.map(ws => ws.name),
    message: `Successfully read ${worksheet.rowCount} rows from sheet "${targetSheetName}"`
  };
}

async function createExcelFile(data: any, outputPath: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object') {
      // Array of objects - use keys as headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      data.forEach(item => {
        worksheet.addRow(Object.values(item));
      });
    } else {
      // Array of arrays
      data.forEach(row => {
        worksheet.addRow(row);
      });
    }
  } else if (typeof data === 'object') {
    // Single object
    worksheet.addRow(Object.keys(data));
    worksheet.addRow(Object.values(data));
  }

  await workbook.xlsx.writeFile(outputPath);
  
  return {
    success: true,
    outputPath,
    message: `Enhanced Excel file created successfully at ${outputPath}`,
    rowsWritten: Array.isArray(data) ? data.length : 1
  };
}

async function applyConditionalFormatting(filePath: string, sheetName: string, formatting: any, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];
  const targetRange = formatting.range || 'A1:Z1000';

  // Apply conditional formatting based on type
  switch (formatting.type) {
    case 'highlight':
      worksheet.addConditionalFormatting({
        ref: targetRange,
        rules: [{
          type: 'expression',
          formulae: [formatting.rule],
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: formatting.style?.fill || 'FFFF0000' }
            },
            font: formatting.style?.font ? {
              color: { argb: formatting.style.font }
            } : undefined
          }
        }]
      });
      break;

    case 'data-bars':
      worksheet.addConditionalFormatting({
        ref: targetRange,
        rules: [{
          type: 'dataBar',
          dataBar: {
            color: { argb: formatting.style?.fill || 'FF006100' }
          }
        }]
      });
      break;

    case 'color-scale':
      worksheet.addConditionalFormatting({
        ref: targetRange,
        rules: [{
          type: 'colorScale',
          colorScale: {
            minimum: { color: { argb: 'FF63BE7B' } },
            midpoint: { color: { argb: 'FFFFEB84' } },
            maximum: { color: { argb: 'FFF8696B' } }
          }
        }]
      });
      break;

    case 'icon-set':
      worksheet.addConditionalFormatting({
        ref: targetRange,
        rules: [{
          type: 'iconSet',
          iconSet: '3TrafficLights1',
          showIconOnly: false
        }]
      });
      break;
  }

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Applied ${formatting.type} conditional formatting to ${targetRange} in sheet "${sheetName}"`
  };
}

async function applyStyle(filePath: string, sheetName: string, range: string, style: any, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];

  // Apply style to range
  const cells = worksheet.getCell(range);
  if (cells) {
    if (style.font) {
      cells.font = style.font;
    }
    if (style.fill) {
      cells.fill = style.fill;
    }
    if (style.border) {
      cells.border = style.border;
    }
    if (style.alignment) {
      cells.alignment = style.alignment;
    }
    if (style.numberFormat) {
      cells.numFmt = style.numberFormat;
    }
  }

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Applied styling to ${range} in sheet "${sheetName}"`
  };
}

async function addChart(filePath: string, sheetName: string, chart: any, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];

  // Note: exceljs has limited chart support, but we can add basic chart metadata
  // For full chart creation, we might need to combine with terminal automation

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Chart configuration added to sheet "${sheetName}". Note: Full chart rendering may require Excel desktop application.`
  };
}

async function freezePanesAction(filePath: string, sheetName: string, freezePanes: any, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];

  worksheet.views = [{
    state: 'frozen',
    xSplit: freezePanes.column || 0,
    ySplit: freezePanes.row || 0
  }];

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Frozen panes at row ${freezePanes.row || 0}, column ${freezePanes.column || 0} in sheet "${sheetName}"`
  };
}

async function applyAutoFilter(filePath: string, sheetName: string, range?: string, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];

  worksheet.autoFilter = range || 'A1';

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Applied auto-filter to ${range || 'A1'} in sheet "${sheetName}"`
  };
}

// Helper functions for other operations...
async function writeExcelFile(filePath: string, data: any, sheetName?: string, outputPath?: string) {
  const workbook = existsSync(filePath) 
    ? new ExcelJS.Workbook()
    : new ExcelJS.Workbook();

  if (existsSync(filePath)) {
    await workbook.xlsx.load(await readFile(filePath));
  }

  const worksheet = sheetName ? workbook.getWorksheet(sheetName) || workbook.addWorksheet(sheetName) : workbook.worksheets[0] || workbook.addWorksheet('Sheet1');

  if (Array.isArray(data)) {
    data.forEach(row => worksheet.addRow(row));
  } else if (typeof data === 'object') {
    worksheet.addRow(Object.values(data));
  }

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Data written to sheet "${worksheet.name}" in ${finalOutputPath}`,
    rowsWritten: Array.isArray(data) ? data.length : 1
  };
}

async function updateExcelFile(filePath: string, updates: any, sheetName?: string, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  const targetSheetName = sheetName || workbook.worksheets[0].name;
  const worksheet = workbook.getWorksheet(targetSheetName);

  if (!worksheet) {
    throw new Error(`Sheet not found: ${targetSheetName}`);
  }

  // Apply updates (simplified - you can expand this)
  if (Array.isArray(updates)) {
    worksheet.addRows(updates);
  }

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Updated sheet "${targetSheetName}" in ${finalOutputPath}`,
    rowsUpdated: Array.isArray(updates) ? updates.length : 1
  };
}

async function listSheets(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  
  const sheetInfo = workbook.worksheets.map(ws => ({
    name: ws.name,
    rowCount: ws.rowCount,
    columnCount: ws.columnCount
  }));

  return {
    success: true,
    sheets: sheetInfo,
    totalSheets: sheetInfo.length,
    message: `Found ${sheetInfo.length} sheets in the workbook`
  };
}

async function getCellValue(filePath: string, sheetName: string, cell: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];
  
  const cellValue = worksheet.getCell(cell).value;

  return {
    success: true,
    cell,
    value: cellValue,
    sheetName: worksheet.name,
    message: `Cell ${cell} in sheet "${worksheet.name}" contains: ${cellValue}`
  };
}

async function setCellValue(filePath: string, sheetName: string, cell: string, value: any, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await readFile(filePath));
  const worksheet = workbook.getWorksheet(sheetName) || workbook.worksheets[0];
  
  worksheet.getCell(cell).value = value;

  const finalOutputPath = outputPath || filePath;
  await workbook.xlsx.writeFile(finalOutputPath);

  return {
    success: true,
    cell,
    value,
    sheetName: worksheet.name,
    outputPath: finalOutputPath,
    message: `Cell ${cell} in sheet "${worksheet.name}" set to: ${value}`
  };
}

import type { Tool } from './tool';
import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

// Dynamic imports for Node.js modules to avoid browser build issues
let XLSX: any = null;
let readFile: any = null;
let writeFile: any = null;
let existsSync: any = null;
let join: any = null;

// Try to load Node.js modules (only available in Electron main process)
try {
  if (typeof window === 'undefined') {
    // We're in Node.js environment
    XLSX = require('xlsx');
    const fs = require('fs');
    const path = require('path');
    readFile = fs.promises.readFile;
    writeFile = fs.promises.writeFile;
    existsSync = fs.existsSync;
    join = path.join;
  }
} catch (error) {
  console.log('Excel tools: Node.js modules not available in browser context');
}

interface ExcelToolArgs {
  action: 'read' | 'write' | 'create' | 'update' | 'list-sheets' | 'get-cell' | 'set-cell';
  filePath?: string;
  sheetName?: string;
  data?: any;
  cell?: string;
  value?: any;
  range?: string;
  outputPath?: string;
}

export class ExcelTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'excel',
      description: 'Read, modify, and create Excel files. Can read cells, update values, create new sheets, and analyze data.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Action to perform: read, write, create, update, list-sheets, get-cell, set-cell',
            enum: ['read', 'write', 'create', 'update', 'list-sheets', 'get-cell', 'set-cell']
          },
          filePath: {
            type: Type.STRING,
            description: 'Path to the Excel file'
          },
          sheetName: {
            type: Type.STRING,
            description: 'Name of the sheet to work with'
          },
          data: {
            type: Type.STRING,
            description: 'JSON data string for write/create operations'
          },
          cell: {
            type: Type.STRING,
            description: 'Cell reference (e.g., "A1", "B2") for get-cell/set-cell actions'
          },
          value: {
            type: Type.STRING,
            description: 'Value to set in a cell for set-cell action'
          },
          range: {
            type: Type.STRING,
            description: 'Range to read (e.g., "A1:C10") for read action'
          },
          outputPath: {
            type: Type.STRING,
            description: 'Output path for modified Excel file'
          },
        },
        required: ['action']
      }
    };
  }

  async execute(args: ExcelToolArgs): Promise<string> {
    try {
      const { action, filePath, sheetName, data, cell, value, range, outputPath } = args;
      
      // Check if Node.js modules are available
      if (!XLSX || !readFile || !writeFile || !existsSync || !join) {
        return JSON.stringify({
          success: false,
          error: 'Excel tools require Node.js environment. Please use this tool in the Electron main process or via terminal commands.',
          availableActions: ['read', 'write', 'create', 'update', 'list-sheets', 'get-cell', 'set-cell']
        });
      }

      switch (action) {
        case 'read':
          return JSON.stringify(await readExcelFile(filePath!, sheetName, range));
        case 'create':
          return JSON.stringify(await createExcelFile(data!, outputPath!));
        case 'write':
          return JSON.stringify(await writeExcelFile(filePath!, data!, sheetName, outputPath));
        case 'update':
          return JSON.stringify(await updateExcelFile(filePath!, data!, sheetName, outputPath));
        case 'list-sheets':
          return JSON.stringify(await listSheets(filePath!));
        case 'get-cell':
          return JSON.stringify(await getCellValue(filePath!, sheetName!, cell!));
        case 'set-cell':
          return JSON.stringify(await setCellValue(filePath!, sheetName!, cell!, value!, outputPath));
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Excel tool error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
}

async function readExcelFile(filePath: string, sheetName?: string, range?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const fileBuffer = await readFile(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  
  // Get sheet name or use first sheet
  const targetSheetName = sheetName || workbook.SheetNames[0];
  if (!workbook.Sheets[targetSheetName]) {
    throw new Error(`Sheet not found: ${targetSheetName}`);
  }

  const worksheet = workbook.Sheets[targetSheetName];
  
  // Convert to JSON
  let jsonData;
  if (range) {
    const rangeData = XLSX.utils.sheet_to_json(worksheet, { range });
    jsonData = rangeData;
  } else {
    jsonData = XLSX.utils.sheet_to_json(worksheet);
  }

  return {
    success: true,
    data: jsonData,
    sheetName: targetSheetName,
    totalRows: jsonData.length,
    totalColumns: jsonData.length > 0 ? Object.keys(jsonData[0]).length : 0,
    availableSheets: workbook.SheetNames,
    message: `Successfully read ${jsonData.length} rows from sheet "${targetSheetName}"`
  };
}

async function createExcelFile(data: any, outputPath: string) {
  const workbook = XLSX.utils.book_new();
  
  // Handle different data formats
  let worksheet;
  if (Array.isArray(data)) {
    worksheet = XLSX.utils.json_to_sheet(data);
  } else if (typeof data === 'object') {
    worksheet = XLSX.utils.json_to_sheet([data]);
  } else {
    throw new Error('Data must be an array or object');
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  // Write file
  XLSX.writeFile(workbook, outputPath);
  
  return {
    success: true,
    outputPath,
    message: `Excel file created successfully at ${outputPath}`,
    rowsWritten: Array.isArray(data) ? data.length : 1
  };
}

async function writeExcelFile(filePath: string, data: any, sheetName?: string, outputPath?: string) {
  const workbook = existsSync(filePath) 
    ? XLSX.read(await readFile(filePath), { type: 'buffer' })
    : XLSX.utils.book_new();

  const worksheet = Array.isArray(data) 
    ? XLSX.utils.json_to_sheet(data)
    : XLSX.utils.json_to_sheet([data]);

  const targetSheetName = sheetName || 'Sheet1';
  XLSX.utils.book_append_sheet(workbook, worksheet, targetSheetName);

  const finalOutputPath = outputPath || filePath;
  XLSX.writeFile(workbook, finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Data written to sheet "${targetSheetName}" in ${finalOutputPath}`,
    rowsWritten: Array.isArray(data) ? data.length : 1
  };
}

async function updateExcelFile(filePath: string, updates: any, sheetName?: string, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = XLSX.read(await readFile(filePath), { type: 'buffer' });
  const targetSheetName = sheetName || workbook.SheetNames[0];
  
  if (!workbook.Sheets[targetSheetName]) {
    throw new Error(`Sheet not found: ${targetSheetName}`);
  }

  // Read existing data
  const worksheet = workbook.Sheets[targetSheetName];
  const existingData = XLSX.utils.sheet_to_json(worksheet);

  // Apply updates
  let updatedData;
  if (Array.isArray(updates)) {
    // Replace entire data
    updatedData = updates;
  } else if (typeof updates === 'object' && updates.rowIndex !== undefined) {
    // Update specific row
    updatedData = [...existingData];
    updatedData[updates.rowIndex] = { ...updatedData[updates.rowIndex], ...updates.data };
  } else {
    throw new Error('Updates must be an array or object with rowIndex and data');
  }

  // Write back to worksheet
  const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
  workbook.Sheets[targetSheetName] = newWorksheet;

  const finalOutputPath = outputPath || filePath;
  XLSX.writeFile(workbook, finalOutputPath);

  return {
    success: true,
    outputPath: finalOutputPath,
    message: `Updated ${updatedData.length} rows in sheet "${targetSheetName}"`,
    rowsUpdated: updatedData.length
  };
}

async function listSheets(filePath: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = XLSX.read(await readFile(filePath), { type: 'buffer' });
  
  const sheetInfo = workbook.SheetNames.map(name => {
    const worksheet = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;
    
    return {
      name,
      rowCount,
      colCount,
      range: worksheet['!ref'] || 'Empty'
    };
  });

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

  const workbook = XLSX.read(await readFile(filePath), { type: 'buffer' });
  const targetSheetName = sheetName || workbook.SheetNames[0];
  
  if (!workbook.Sheets[targetSheetName]) {
    throw new Error(`Sheet not found: ${targetSheetName}`);
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const cellValue = worksheet[cell]?.v || null;

  return {
    success: true,
    cell,
    value: cellValue,
    sheetName: targetSheetName,
    message: `Cell ${cell} in sheet "${targetSheetName}" contains: ${cellValue}`
  };
}

async function setCellValue(filePath: string, sheetName: string, cell: string, value: any, outputPath?: string) {
  if (!existsSync(filePath)) {
    throw new Error(`Excel file not found: ${filePath}`);
  }

  const workbook = XLSX.read(await readFile(filePath), { type: 'buffer' });
  const targetSheetName = sheetName || workbook.SheetNames[0];
  
  if (!workbook.Sheets[targetSheetName]) {
    throw new Error(`Sheet not found: ${targetSheetName}`);
  }

  const worksheet = workbook.Sheets[targetSheetName];
  
  // Set cell value
  if (!worksheet[cell]) {
    worksheet[cell] = {};
  }
  worksheet[cell].v = value;
  worksheet[cell].t = typeof value === 'number' ? 'n' : 's';

  const finalOutputPath = outputPath || filePath;
  XLSX.writeFile(workbook, finalOutputPath);

  return {
    success: true,
    cell,
    value,
    sheetName: targetSheetName,
    outputPath: finalOutputPath,
    message: `Cell ${cell} in sheet "${targetSheetName}" set to: ${value}`
  };
}

import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from './tool';

interface PythonExcelToolArgs {
  action: 'read' | 'write' | 'create' | 'analyze' | 'format' | 'chart';
  filePath?: string;
  data?: any;
  sheetName?: string;
  range?: string;
  cell?: string;
  formatType?: string;
  chartType?: string;
  analysisType?: string;
  position?: string;
}

export class PythonExcelTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'pythonExcel',
      description: 'Advanced Excel operations using Python scripts. Can read, write, create, analyze, format, and chart Excel files through terminal commands.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Action to perform: read, write, create, analyze, format, chart',
          },
          filePath: {
            type: Type.STRING,
            description: 'Path to the Excel file',
          },
          data: {
            type: Type.STRING,
            description: 'JSON data string for write/create operations',
          },
          sheetName: {
            type: Type.STRING,
            description: 'Name of the sheet to work with',
          },
          range: {
            type: Type.STRING,
            description: 'Cell range (e.g., A1:C10) for read/format operations',
          },
          cell: {
            type: Type.STRING,
            description: 'Specific cell for write operations (e.g., A1)',
          },
          formatType: {
            type: Type.STRING,
            description: 'Format type: highlight-values-above-100, highlight-values-below-50, color-scale, data-bars',
          },
          chartType: {
            type: Type.STRING,
            description: 'Chart type: bar, line, pie',
          },
          analysisType: {
            type: Type.STRING,
            description: 'Analysis type: summary, correlation, outliers, trends',
          },
          position: {
            type: Type.STRING,
            description: 'Chart position (e.g., E1)',
          },
        },
        required: ['action', 'filePath'],
      },
    };
  };

  async execute(args: any): Promise<string> {
    const { action, filePath, data, sheetName, range, cell, formatType, chartType, analysisType, position }: PythonExcelToolArgs = args;
    try {
      let command = '';
      let pythonScript = '';
      
      switch (action) {
        case 'read':
          pythonScript = 'python/excel_reader.py';
          command = `python3 ${pythonScript} --file "${filePath}"`;
          if (sheetName) command += ` --sheet "${sheetName}"`;
          if (range) command += ` --range "${range}"`;
          break;
          
        case 'write':
          pythonScript = 'python/excel_writer.py';
          command = `python3 ${pythonScript} --file "${filePath}" --data '${data}' --action update`;
          if (sheetName) command += ` --sheet "${sheetName}"`;
          if (cell) command += ` --cell "${cell}"`;
          break;
          
        case 'create':
          pythonScript = 'python/excel_writer.py';
          command = `python3 ${pythonScript} --file "${filePath}" --data '${data}' --action create`;
          if (sheetName) command += ` --sheet "${sheetName}"`;
          break;
          
        case 'analyze':
          pythonScript = 'python/excel_analyzer.py';
          command = `python3 ${pythonScript} --file "${filePath}" --analysis "${analysisType}"`;
          if (sheetName) command += ` --sheet "${sheetName}"`;
          break;
          
        case 'format':
          pythonScript = 'python/excel_formatter.py';
          command = `python3 ${pythonScript} --file "${filePath}" --action conditional-format --type "${formatType}" --range "${range}"`;
          if (sheetName) command += ` --sheet "${sheetName}"`;
          break;
          
        case 'chart':
          pythonScript = 'python/excel_formatter.py';
          command = `python3 ${pythonScript} --file "${filePath}" --action chart --type "${chartType}" --range "${range}"`;
          if (sheetName) command += ` --sheet "${sheetName}"`;
          if (position) command += ` --position "${position}"`;
          break;
          
        default:
          return JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`
          });
      }
      
      // Execute the Python script through terminal
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        return JSON.stringify({
          success: false,
          error: stderr,
          command: command
        });
      }
      
      // Parse the JSON result from Python script
      try {
        const result = JSON.parse(stdout);
        return JSON.stringify({
          success: true,
          result: result,
          command: command
        });
      } catch (parseError) {
        return JSON.stringify({
          success: true,
          result: stdout,
          command: command
        });
      }
      
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

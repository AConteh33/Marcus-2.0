import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";

// Dynamic imports for Node.js modules to avoid browser build issues
let exec: any = null;
let writeFile: any = null;
let unlink: any = null;
let join: any = null;
let tmpdir: any = null;

// Try to load Node.js modules (only available in Electron main process)
try {
  if (typeof window === 'undefined') {
    // We're in Node.js environment
    const { exec: execFunc } = require('child_process');
    const { promisify } = require('util');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    exec = promisify(execFunc);
    writeFile = fs.promises.writeFile;
    unlink = fs.promises.unlink;
    join = path.join;
    tmpdir = os.tmpdir;
  }
} catch (error) {
  console.log('Excel Terminal tools: Node.js modules not available in browser context');
}

interface Tool {
    getDeclaration(): FunctionDeclaration;
    execute(args: any): Promise<string>;
}

interface ExcelTerminalToolArgs {
  action: 'open-excel' | 'conditional-format' | 'apply-style' | 'create-chart' | 'macro' | 'vba-script';
  filePath?: string;
  script?: string;
  range?: string;
  formatting?: {
    type: 'highlight' | 'data-bars' | 'color-scale' | 'icon-set';
    condition: string;
    style: string;
  };
}

export const ExcelTerminalTool: Tool = {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'excelTerminal',
      description: 'Terminal-based Excel automation for advanced formatting and operations. Uses system commands to control Excel application directly.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Action: open-excel, conditional-format, apply-style, create-chart, macro, vba-script',
          },
          filePath: {
            type: Type.STRING,
            description: 'Path to Excel file',
          },
          script: {
            type: Type.STRING,
            description: 'VBA script or terminal command to execute',
          },
          range: {
            type: Type.STRING,
            description: 'Cell range for formatting (e.g., "A1:C10")',
          },
          formatting: {
            type: Type.OBJECT,
            description: 'Conditional formatting configuration',
            properties: {
              type: { type: Type.STRING },
              condition: { type: Type.STRING },
              style: { type: Type.STRING },
            },
          },
        },
        required: ['action'],
      },
    };
  },

  execute: async ({ action, filePath, script, range, formatting }: ExcelTerminalToolArgs) => {
    try {
      // Check if Node.js modules are available
      if (!exec || !writeFile || !unlink || !join || !tmpdir) {
        return JSON.stringify({
          success: false,
          error: 'Excel Terminal tools require Node.js environment. Please use this tool in the Electron main process or via terminal commands.',
          availableActions: ['open-excel', 'conditional-format', 'apply-style', 'create-chart', 'macro', 'vba-script']
        });
      }

      let result;
      switch (action) {
        case 'open-excel':
          result = await openExcelFile(filePath!);
          break;
        case 'conditional-format':
          result = await applyConditionalFormattingViaTerminal(filePath!, formatting!, range);
          break;
        case 'apply-style':
          result = await applyStyleViaTerminal(filePath!, script!, range);
          break;
        case 'create-chart':
          result = await createChartViaTerminal(filePath!, script!);
          break;
        case 'macro':
          result = await runExcelMacro(filePath!, script!);
          break;
        case 'vba-script':
          result = await executeVBAScript(filePath!, script!);
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

async function openExcelFile(filePath: string) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // macOS
    await execAsync(`open "${filePath}"`);
    return {
      success: true,
      message: `Excel file opened: ${filePath}`,
      method: 'macOS open command'
    };
  } catch (macError) {
    try {
      // Windows
      await execAsync(`start excel "${filePath}"`);
      return {
        success: true,
        message: `Excel file opened: ${filePath}`,
        method: 'Windows start command'
      };
    } catch (winError) {
      try {
        // Linux
        await execAsync(`xdg-open "${filePath}"`);
        return {
          success: true,
          message: `Excel file opened: ${filePath}`,
          method: 'Linux xdg-open command'
        };
      } catch (linuxError) {
        throw new Error(`Failed to open Excel file on any platform: ${linuxError}`);
      }
    }
  }
}

async function applyConditionalFormattingViaTerminal(filePath: string, formatting: any, range?: string) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  // Create VBA script for conditional formatting
  const vbaScript = `
Sub ApplyConditionalFormatting()
    Dim wb As Workbook
    Dim ws As Worksheet
    Dim rng As Range
    
    Set wb = Workbooks.Open("${filePath.replace(/\\/g, '\\\\')}")
    Set ws = wb.Sheets(1)
    Set rng = ws.Range("${range || 'A1:Z1000'}")
    
    ' Clear existing conditional formatting
    rng.FormatConditions.Delete
    
    ' Apply new conditional formatting
    Select Case "${formatting.type}"
        Case "highlight"
            rng.FormatConditions.Add Type:=xlExpression, Formula1:="${formatting.condition}"
            rng.FormatConditions(rng.FormatConditions.Count).Interior.Color = RGB(255, 0, 0)
        Case "data-bars"
            rng.FormatConditions.AddDatabar
            rng.FormatConditions(rng.FormatConditions.Count).BarColor.Color = RGB(0, 100, 0)
        Case "color-scale"
            rng.FormatConditions.AddColorScale ColorScaleType:=3
        Case "icon-set"
            rng.FormatConditions.AddIconSetCondition
    End Select
    
    wb.Save
    wb.Close
    Application.Quit
End Sub

Call ApplyConditionalFormatting
`;

  try {
    // Save VBA script to temporary file
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    
    const tempScriptPath = join(tmpdir(), `excel_format_${Date.now()}.vbs`);
    await writeFile(tempScriptPath, vbaScript);
    
    // Execute VBA script
    await execAsync(`cscript //nologo "${tempScriptPath}"`);
    
    // Clean up
    await unlink(tempScriptPath);
    
    return {
      success: true,
      message: `Applied ${formatting.type} conditional formatting to ${range || 'A1:Z1000'}`,
      method: 'VBA script execution'
    };
  } catch (error) {
    throw new Error(`Failed to apply conditional formatting: ${error}`);
  }
}

async function applyStyleViaTerminal(filePath: string, styleScript: string, range?: string) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const vbaScript = `
Sub ApplyStyle()
    Dim wb As Workbook
    Dim ws As Worksheet
    Dim rng As Range
    
    Set wb = Workbooks.Open("${filePath.replace(/\\/g, '\\\\')}")
    Set ws = wb.Sheets(1)
    Set rng = ws.Range("${range || 'A1:Z1000'}")
    
    ' Apply custom style
    ${styleScript}
    
    wb.Save
    wb.Close
    Application.Quit
End Sub

Call ApplyStyle
`;

  try {
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    
    const tempScriptPath = join(tmpdir(), `excel_style_${Date.now()}.vbs`);
    await writeFile(tempScriptPath, vbaScript);
    
    await execAsync(`cscript //nologo "${tempScriptPath}"`);
    await unlink(tempScriptPath);
    
    return {
      success: true,
      message: `Applied style to ${range || 'A1:Z1000'}`,
      method: 'VBA script execution'
    };
  } catch (error) {
    throw new Error(`Failed to apply style: ${error}`);
  }
}

async function createChartViaTerminal(filePath: string, chartScript: string) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const vbaScript = `
Sub CreateChart()
    Dim wb As Workbook
    Dim ws As Worksheet
    Dim chartObj As ChartObject
    
    Set wb = Workbooks.Open("${filePath.replace(/\\/g, '\\\\')}")
    Set ws = wb.Sheets(1)
    
    ' Create chart
    ${chartScript}
    
    wb.Save
    wb.Close
    Application.Quit
End Sub

Call CreateChart
`;

  try {
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    
    const tempScriptPath = join(tmpdir(), `excel_chart_${Date.now()}.vbs`);
    await writeFile(tempScriptPath, vbaScript);
    
    await execAsync(`cscript //nologo "${tempScriptPath}"`);
    await unlink(tempScriptPath);
    
    return {
      success: true,
      message: 'Chart created successfully',
      method: 'VBA script execution'
    };
  } catch (error) {
    throw new Error(`Failed to create chart: ${error}`);
  }
}

async function runExcelMacro(filePath: string, macroName: string) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    await execAsync(`cscript //nologo -e:vbscript "CreateObject(\"Excel.Application\").Workbooks.Open(\"${filePath.replace(/\\/g, '\\\\')}\").Run(\"${macroName}\")"`);
    
    return {
      success: true,
      message: `Macro "${macroName}" executed successfully`,
      method: 'VBScript execution'
    };
  } catch (error) {
    throw new Error(`Failed to run macro: ${error}`);
  }
}

async function executeVBAScript(filePath: string, vbaCode: string) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const fullScript = `
Sub ExecuteCustomVBA()
    Dim wb As Workbook
    Dim ws As Worksheet
    
    Set wb = Workbooks.Open("${filePath.replace(/\\/g, '\\\\')}")
    Set ws = wb.Sheets(1)
    
    ' Custom VBA code
    ${vbaCode}
    
    wb.Save
    wb.Close
    Application.Quit
End Sub

Call ExecuteCustomVBA
`;

  try {
    const { writeFile, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    
    const tempScriptPath = join(tmpdir(), `excel_custom_${Date.now()}.vbs`);
    await writeFile(tempScriptPath, fullScript);
    
    await execAsync(`cscript //nologo "${tempScriptPath}"`);
    await unlink(tempScriptPath);
    
    return {
      success: true,
      message: 'Custom VBA script executed successfully',
      method: 'VBA script execution'
    };
  } catch (error) {
    throw new Error(`Failed to execute VBA script: ${error}`);
  }
}

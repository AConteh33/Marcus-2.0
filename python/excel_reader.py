#!/usr/bin/env python3
"""
Excel Reader Script - Read Excel files and return data
Usage: python3 excel_reader.py --file <path> --sheet <sheet_name> --range <range>
"""

import pandas as pd
import openpyxl
import argparse
import sys
import json

def read_excel_data(file_path, sheet_name=None, range=None):
    try:
        if range:
            # Read specific range using openpyxl
            wb = openpyxl.load_workbook(file_path, read_only=True)
            ws = wb[sheet_name] if sheet_name else wb.active
            
            # Parse range (e.g., "A1:C10")
            cells = ws[range]
            data = []
            for row in cells:
                row_data = [cell.value for cell in row]
                data.append(row_data)
            
            result = {
                "success": True,
                "data": data,
                "range": range,
                "sheet": sheet_name or wb.active.title
            }
        else:
            # Read entire sheet using pandas
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
                df = pd.read_excel(file_path)
            
            result = {
                "success": True,
                "data": df.to_dict('records'),
                "columns": df.columns.tolist(),
                "shape": df.shape,
                "sheet": sheet_name
            }
        
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def main():
    parser = argparse.ArgumentParser(description='Read Excel data')
    parser.add_argument('--file', required=True, help='Excel file path')
    parser.add_argument('--sheet', help='Sheet name')
    parser.add_argument('--range', help='Cell range (e.g., A1:C10)')
    
    args = parser.parse_args()
    
    result = read_excel_data(args.file, args.sheet, args.range)
    print(result)

if __name__ == "__main__":
    main()

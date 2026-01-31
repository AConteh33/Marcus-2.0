#!/usr/bin/env python3
"""
Excel Analyzer Script - Analyze Excel data and provide insights
Usage: python3 excel_analyzer.py --file <path> --analysis <type>
"""

import pandas as pd
import numpy as np
import argparse
import sys
import json

def analyze_excel_data(file_path, analysis_type, sheet_name=None):
    try:
        # Read Excel file
        if sheet_name:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
        else:
            df = pd.read_excel(file_path)
        
        result = {"success": True, "file": file_path, "sheet": sheet_name}
        
        if analysis_type == "summary":
            # Basic summary statistics
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            summary = {
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "numeric_columns": len(numeric_cols),
                "column_names": df.columns.tolist(),
                "data_types": df.dtypes.to_dict(),
                "missing_values": df.isnull().sum().to_dict()
            }
            
            if len(numeric_cols) > 0:
                summary["statistics"] = df[numeric_cols].describe().to_dict()
            
            result["analysis"] = summary
            
        elif analysis_type == "correlation":
            # Correlation analysis for numeric columns
            numeric_df = df.select_dtypes(include=[np.number])
            
            if len(numeric_df.columns) >= 2:
                correlation_matrix = numeric_df.corr()
                result["analysis"] = {
                    "correlation_matrix": correlation_matrix.to_dict(),
                    "strong_correlations": []
                }
                
                # Find strong correlations (> 0.7 or < -0.7)
                for i in range(len(correlation_matrix.columns)):
                    for j in range(i+1, len(correlation_matrix.columns)):
                        corr_value = correlation_matrix.iloc[i, j]
                        if abs(corr_value) > 0.7:
                            result["analysis"]["strong_correlations"].append({
                                "column1": correlation_matrix.columns[i],
                                "column2": correlation_matrix.columns[j],
                                "correlation": corr_value
                            })
            else:
                result["analysis"] = {"error": "Need at least 2 numeric columns for correlation analysis"}
        
        elif analysis_type == "outliers":
            # Outlier detection using IQR method
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            outliers_info = {}
            
            for col in numeric_cols:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col]
                
                outliers_info[col] = {
                    "count": len(outliers),
                    "percentage": (len(outliers) / len(df)) * 100,
                    "values": outliers.tolist()[:10],  # First 10 outliers
                    "bounds": {"lower": lower_bound, "upper": upper_bound}
                }
            
            result["analysis"] = outliers_info
            
        elif analysis_type == "trends":
            # Simple trend analysis for time series or ordered data
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            trends = {}
            
            for col in numeric_cols:
                values = df[col].dropna()
                if len(values) > 1:
                    # Simple linear trend
                    x = np.arange(len(values))
                    slope = np.polyfit(x, values, 1)[0]
                    
                    trends[col] = {
                        "trend": "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
                        "slope": slope,
                        "first_value": values.iloc[0],
                        "last_value": values.iloc[-1],
                        "change": values.iloc[-1] - values.iloc[0]
                    }
            
            result["analysis"] = trends
        
        return json.dumps(result)
    
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def main():
    parser = argparse.ArgumentParser(description='Analyze Excel data')
    parser.add_argument('--file', required=True, help='Excel file path')
    parser.add_argument('--analysis', choices=['summary', 'correlation', 'outliers', 'trends'], required=True, help='Analysis type')
    parser.add_argument('--sheet', help='Sheet name')
    
    args = parser.parse_args()
    
    result = analyze_excel_data(args.file, args.analysis, args.sheet)
    print(result)

if __name__ == "__main__":
    main()

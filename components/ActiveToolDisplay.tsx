import React from 'react';

interface ToolUsage {
    toolName: string;
    args?: any;
    result?: string;
    timestamp?: Date;
}

interface ActiveToolDisplayProps {
    toolUsage: ToolUsage | null;
    className?: string;
}

export const ActiveToolDisplay: React.FC<ActiveToolDisplayProps> = ({ toolUsage, className = '' }) => {
    if (!toolUsage) {
        return null;
    }

    const formatDuration = (timestamp?: Date) => {
        if (!timestamp) return '';
        const duration = new Date().getTime() - timestamp.getTime();
        const seconds = Math.floor(duration / 1000);
        return `${seconds}s`;
    };

    return (
        <div className={`bg-gray-900/90 backdrop-blur-sm border border-amber-500/20 rounded-lg p-3 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center">
                    <span className="mr-2">🔧</span>
                    Tool Result
                </h3>
                <span className="text-xs text-green-400 flex items-center">
                    <span className="mr-1">✅</span>
                    completed
                </span>
            </div>
            
            <div className="space-y-1">
                <div className="text-sm font-medium text-gray-300">
                    {toolUsage.toolName}
                </div>
                
                {toolUsage.timestamp && (
                    <div className="text-xs text-gray-400">
                        {formatDuration(toolUsage.timestamp)} ago
                    </div>
                )}
                
                {toolUsage.result && (
                    <div className="text-xs text-gray-300 mt-2 max-h-20 overflow-y-auto bg-gray-800/50 rounded p-2 border border-green-200">
                        <strong>Result:</strong> {toolUsage.result.substring(0, 300)}
                        {toolUsage.result.length > 300 && '...'}
                    </div>
                )}
            </div>
        </div>
    );
};

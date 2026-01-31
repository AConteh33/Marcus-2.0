import React, { useState, useEffect } from 'react';
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  XCircle,
  Info
} from 'lucide-react';

interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error';
  version?: string;
  progress?: number;
  error?: string;
  downloadUrl?: string;
}

export const AutoUpdateManager: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for update status changes
    const handleUpdateStatus = (event: any, status: UpdateStatus) => {
      setUpdateStatus(status);
      if (status.status === 'available') {
        setIsVisible(true);
      }
    };

    // Check initial status
    window.electronAPI.onUpdateStatus(handleUpdateStatus);

    return () => {
      // Cleanup listeners
    };
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateStatus({ status: 'checking' });
    try {
      const result = await window.electronAPI.checkForUpdates();
      setUpdateStatus(result);
    } catch (error) {
      setUpdateStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handleDownloadUpdate = async () => {
    setUpdateStatus(prev => ({ ...prev, status: 'downloading', progress: 0 }));
    try {
      const result = await window.electronAPI.downloadUpdate();
      if (result.success) {
        setUpdateStatus({ status: 'downloaded' });
      } else {
        setUpdateStatus({ 
          status: 'error', 
          error: result.error || 'Download failed' 
        });
      }
    } catch (error) {
      setUpdateStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Download failed' 
      });
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateStatus({ status: 'installing' });
    try {
      await window.electronAPI.installUpdate();
    } catch (error) {
      setUpdateStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Installation failed' 
      });
    }
  };

  const getStatusIcon = () => {
    switch (updateStatus.status) {
      case 'checking':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'available':
        return <Download className="w-4 h-4" />;
      case 'downloading':
        return <Download className="w-4 h-4 animate-bounce" />;
      case 'downloaded':
        return <CheckCircle className="w-4 h-4" />;
      case 'installing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (updateStatus.status) {
      case 'checking':
        return 'text-blue-400';
      case 'available':
        return 'text-green-400';
      case 'downloading':
        return 'text-yellow-400';
      case 'downloaded':
        return 'text-green-400';
      case 'installing':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (updateStatus.status) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `Update available: ${updateStatus.version}`;
      case 'downloading':
        return `Downloading... ${updateStatus.progress || 0}%`;
      case 'downloaded':
        return 'Update downloaded - Ready to install';
      case 'installing':
        return 'Installing update...';
      case 'error':
        return `Error: ${updateStatus.error}`;
      default:
        return 'Up to date';
    }
  };

  if (!isVisible && updateStatus.status === 'idle') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-xl max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <span className="text-white font-medium text-sm">
            Auto-Update
          </span>
        </div>
        {updateStatus.status === 'idle' && (
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-gray-300 text-sm">
          {getStatusText()}
        </div>

        {updateStatus.status === 'available' && (
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadUpdate}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Later
            </button>
          </div>
        )}

        {updateStatus.status === 'downloaded' && (
          <div className="flex space-x-2">
            <button
              onClick={handleInstallUpdate}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Install & Restart</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Later
            </button>
          </div>
        )}

        {updateStatus.status === 'idle' && (
          <div className="flex space-x-2">
            <button
              onClick={handleCheckForUpdates}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Check Now</span>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {updateStatus.status === 'error' && (
          <div className="flex space-x-2">
            <button
              onClick={handleCheckForUpdates}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {updateStatus.status === 'downloading' && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${updateStatus.progress || 0}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

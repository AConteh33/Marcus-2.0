import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from './tool';

interface MouseControlArgs {
  action: 'move' | 'click' | 'doubleClick' | 'rightClick' | 'drag' | 'scroll';
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  scrollDirection?: 'up' | 'down';
  scrollAmount?: number;
  duration?: number;
}

export class MouseControlTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'mouseControl',
      description: 'Control mouse movements and clicks. Can move cursor, click, double-click, right-click, drag, and scroll.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Mouse action: move, click, doubleClick, rightClick, drag, scroll',
            enum: ['move', 'click', 'doubleClick', 'rightClick', 'drag', 'scroll']
          },
          x: {
            type: Type.NUMBER,
            description: 'X coordinate for mouse position (0- screen width)'
          },
          y: {
            type: Type.NUMBER,
            description: 'Y coordinate for mouse position (0- screen height)'
          },
          button: {
            type: Type.STRING,
            description: 'Mouse button to use',
            enum: ['left', 'right', 'middle']
          },
          scrollDirection: {
            type: Type.STRING,
            description: 'Direction to scroll',
            enum: ['up', 'down']
          },
          scrollAmount: {
            type: Type.NUMBER,
            description: 'Amount to scroll (default: 3)'
          },
          duration: {
            type: Type.NUMBER,
            description: 'Duration in milliseconds for smooth movements (default: 100)'
          }
        },
        required: ['action']
      }
    };
  }

  async execute(args: MouseControlArgs): Promise<string> {
    try {
      const { action, x, y, button = 'left', scrollDirection = 'down', scrollAmount = 3, duration = 100 } = args;
      
      // For Electron environment, we'll use IPC to communicate with main process
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.mouseControl({
          action,
          x,
          y,
          button,
          scrollDirection,
          scrollAmount,
          duration
        });
        return result;
      }
      
      // For browser environment, we'll provide a simulation
      switch (action) {
        case 'move':
          if (x !== undefined && y !== undefined) {
            return `Mouse moved to position (${x}, ${y}) - Note: Actual mouse movement requires Electron environment`;
          }
          return 'Missing coordinates for mouse movement';
          
        case 'click':
          return `Mouse ${button} click at current position - Note: Actual clicking requires Electron environment`;
          
        case 'doubleClick':
          return `Mouse double click - Note: Actual clicking requires Electron environment`;
          
        case 'rightClick':
          return `Mouse right click - Note: Actual clicking requires Electron environment`;
          
        case 'drag':
          return `Mouse drag action - Note: Actual dragging requires Electron environment`;
          
        case 'scroll':
          return `Mouse scroll ${scrollDirection} by ${scrollAmount} units - Note: Actual scrolling requires Electron environment`;
          
        default:
          return `Unknown mouse action: ${action}`;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Mouse control error:', errorMessage);
      return `Failed to control mouse: ${errorMessage}`;
    }
  }
}

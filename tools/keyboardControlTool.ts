import type { FunctionDeclaration } from "@google/genai";
import { Type } from "@google/genai";
import type { Tool } from './tool';

interface KeyboardControlArgs {
  action: 'type' | 'press' | 'hold' | 'release' | 'combo';
  text?: string;
  key?: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'cmd' | 'meta';
  modifiers?: string[];
  duration?: number;
}

export class KeyboardControlTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'keyboardControl',
      description: 'Control keyboard input. Can type text, press keys, hold keys, release keys, and use key combinations.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            description: 'Keyboard action: type, press, hold, release, combo',
            enum: ['type', 'press', 'hold', 'release', 'combo']
          },
          text: {
            type: Type.STRING,
            description: 'Text to type (for type action)'
          },
          key: {
            type: Type.STRING,
            description: 'Key to press (e.g., "a", "enter", "space", "tab", "escape")'
          },
          modifier: {
            type: Type.STRING,
            description: 'Single modifier key',
            enum: ['ctrl', 'alt', 'shift', 'cmd', 'meta']
          },
          modifiers: {
            type: Type.ARRAY,
            description: 'Multiple modifier keys for combos',
            items: {
              type: Type.STRING,
              enum: ['ctrl', 'alt', 'shift', 'cmd', 'meta']
            }
          },
          duration: {
            type: Type.NUMBER,
            description: 'Duration in milliseconds for hold actions (default: 100)'
          }
        },
        required: ['action']
      }
    };
  }

  async execute(args: KeyboardControlArgs): Promise<string> {
    try {
      const { action, text, key, modifier, modifiers, duration = 100 } = args;
      
      // For Electron environment, we'll use IPC to communicate with main process
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.keyboardControl({
          action,
          text,
          key,
          modifier,
          modifiers,
          duration
        });
        return result;
      }
      
      // For browser environment, we'll provide a simulation
      switch (action) {
        case 'type':
          if (text) {
            return `Typed text: "${text}" - Note: Actual typing requires Electron environment`;
          }
          return 'Missing text for typing action';
          
        case 'press':
          if (key) {
            return `Pressed key: ${key} - Note: Actual key press requires Electron environment`;
          }
          return 'Missing key for press action';
          
        case 'hold':
          if (key) {
            return `Held key: ${key} for ${duration}ms - Note: Actual key hold requires Electron environment`;
          }
          return 'Missing key for hold action';
          
        case 'release':
          if (key) {
            return `Released key: ${key} - Note: Actual key release requires Electron environment`;
          }
          return 'Missing key for release action';
          
        case 'combo':
          if (key && modifiers) {
            return `Pressed key combo: ${modifiers.join('+')}+${key} - Note: Actual key combo requires Electron environment`;
          }
          if (key && modifier) {
            return `Pressed key combo: ${modifier}+${key} - Note: Actual key combo requires Electron environment`;
          }
          return 'Missing key or modifiers for combo action';
          
        default:
          return `Unknown keyboard action: ${action}`;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Keyboard control error:', errorMessage);
      return `Failed to control keyboard: ${errorMessage}`;
    }
  }
}

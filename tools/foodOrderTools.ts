import type { FunctionDeclaration } from '@google/genai';
import type { Tool } from './tool';
import { menuCategories, findMenuItem, calculateOrderTotal, formatPrice } from '../data/menuData';

type OrderUpdateFn = (updater: (prev: any[]) => any[]) => void;

export class AddToOrderTool implements Tool {
  private updateOrder: OrderUpdateFn;

  constructor(updateOrder: OrderUpdateFn) {
    this.updateOrder = updateOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'addToOrder',
      description: 'Add a food item to the customer order. Use the menu item name exactly as it appears on the menu.',
      parameters: {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'Name of the food item to add' },
          quantity: { type: 'number', description: 'Quantity to add (default 1)' }
        },
        required: ['itemName']
      }
    };
  }

  async execute(args: { itemName: string; quantity?: number }): Promise<string> {
    const item = findMenuItem(args.itemName);
    if (!item) {
      const available = menuCategories.flatMap(c => c.items.map(i => i.name)).join(', ');
      return `Item "${args.itemName}" not found on the menu. Available items: ${available}`;
    }
    const qty = args.quantity || 1;
    this.updateOrder(prev => {
      const existing = prev.find((o: any) => o.menuItem.id === item.id);
      if (existing) {
        return prev.map((o: any) => o.menuItem.id === item.id ? { ...o, quantity: o.quantity + qty } : o);
      }
      return [...prev, { menuItem: item, quantity: qty }];
    });
    return `Added ${qty > 1 ? qty + ' ' : ''}${item.name} (${formatPrice(item.price * qty)}) to the order.`;
  }
}

export class RemoveFromOrderTool implements Tool {
  private updateOrder: OrderUpdateFn;

  constructor(updateOrder: OrderUpdateFn) {
    this.updateOrder = updateOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'removeFromOrder',
      description: 'Remove a food item from the customer order.',
      parameters: {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'Name of the food item to remove' }
        },
        required: ['itemName']
      }
    };
  }

  async execute(args: { itemName: string }): Promise<string> {
    const item = findMenuItem(args.itemName);
    if (!item) return `Item "${args.itemName}" not found.`;
    this.updateOrder(prev => prev.filter((o: any) => o.menuItem.id !== item.id));
    return `Removed ${item.name} from the order.`;
  }
}

export class UpdateOrderItemTool implements Tool {
  private updateOrder: OrderUpdateFn;

  constructor(updateOrder: OrderUpdateFn) {
    this.updateOrder = updateOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'updateOrderItem',
      description: 'Update the quantity of a food item in the order. Set quantity to 0 to remove.',
      parameters: {
        type: 'object',
        properties: {
          itemName: { type: 'string', description: 'Name of the food item' },
          quantity: { type: 'number', description: 'New quantity' }
        },
        required: ['itemName', 'quantity']
      }
    };
  }

  async execute(args: { itemName: string; quantity: number }): Promise<string> {
    const item = findMenuItem(args.itemName);
    if (!item) return `Item "${args.itemName}" not found.`;
    if (args.quantity <= 0) {
      this.updateOrder(prev => prev.filter((o: any) => o.menuItem.id !== item.id));
      return `Removed ${item.name} from the order.`;
    }
    this.updateOrder(prev => {
      const existing = prev.find((o: any) => o.menuItem.id === item.id);
      if (existing) {
        return prev.map((o: any) => o.menuItem.id === item.id ? { ...o, quantity: args.quantity } : o);
      }
      return [...prev, { menuItem: item, quantity: args.quantity }];
    });
    return `Updated ${item.name} quantity to ${args.quantity}.`;
  }
}

export class ClearOrderTool implements Tool {
  private updateOrder: OrderUpdateFn;

  constructor(updateOrder: OrderUpdateFn) {
    this.updateOrder = updateOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'clearOrder',
      description: 'Clear all items from the customer order. Use when customer wants to start over.',
      parameters: { type: 'object', properties: {} }
    };
  }

  async execute(): Promise<string> {
    this.updateOrder(() => []);
    return 'Order cleared. Ready to take a new order.';
  }
}

export class GetOrderSummaryTool implements Tool {
  private getOrder: () => any[];

  constructor(getOrder: () => any[]) {
    this.getOrder = getOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'getOrderSummary',
      description: 'Get the current order summary with all items, quantities, and total price.',
      parameters: { type: 'object', properties: {} }
    };
  }

  async execute(): Promise<string> {
    const order = this.getOrder();
    if (order.length === 0) return 'The order is currently empty.';
    const lines = order.map((o: any) => `${o.menuItem.name} x${o.quantity} — ${formatPrice(o.menuItem.price * o.quantity)}`);
    const total = calculateOrderTotal(order);
    return `Current order:\n${lines.join('\n')}\n\nTotal: ${formatPrice(total)}`;
  }
}

export class ListMenuTool implements Tool {
  getDeclaration(): FunctionDeclaration {
    return {
      name: 'listMenu',
      description: 'List all available food items on the menu with prices. Use when customer asks what is available.',
      parameters: { type: 'object', properties: {} }
    };
  }

  async execute(): Promise<string> {
    return menuCategories.map(cat =>
      `${cat.name}:\n${cat.items.map(i => `  ${i.name} — ${formatPrice(i.price)}: ${i.description}`).join('\n')}`
    ).join('\n\n');
  }
}

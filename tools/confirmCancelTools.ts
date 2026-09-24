import type { FunctionDeclaration } from '@google/genai';
import type { Tool } from './tool';
import { calculateOrderTotal, formatPrice } from '../data/menuData';

type OrderConfirmFn = () => void;
type OrderCancelFn = () => void;
type GetOrderFn = () => any[];

export class PlaceOrderTool implements Tool {
  private onConfirm: OrderConfirmFn;
  private getOrder: GetOrderFn;

  constructor(onConfirm: OrderConfirmFn, getOrder: GetOrderFn) {
    this.onConfirm = onConfirm;
    this.getOrder = getOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'placeOrder',
      description: 'Place/confirm the customer order. Call this when the customer confirms they want to place the order.',
      parameters: { type: 'object', properties: {} }
    };
  }

  async execute(): Promise<string> {
    const order = this.getOrder();
    console.log('[PlaceOrderTool] execute called, order length:', order.length);
    if (order.length === 0) return 'ERROR: Order is empty. Nothing to place.';

    const lines = order.map((o: any) => `${o.menuItem.name} x${o.quantity}`);
    const total = calculateOrderTotal(order);

    this.onConfirm();
    console.log('[PlaceOrderTool] onConfirm called, order confirmed');

    return `ORDER_CONFIRMED. Items: ${lines.join(', ')}. Total: ${formatPrice(total)}. Your order has been placed successfully.`;
  }
}

export class CancelOrderTool implements Tool {
  private onCancel: OrderCancelFn;
  private getOrder: GetOrderFn;

  constructor(onCancel: OrderCancelFn, getOrder: GetOrderFn) {
    this.onCancel = onCancel;
    this.getOrder = getOrder;
  }

  getDeclaration(): FunctionDeclaration {
    return {
      name: 'cancelOrder',
      description: 'Cancel and clear the entire customer order. Call this when the customer says no, changes their mind, or wants to cancel.',
      parameters: { type: 'object', properties: {} }
    };
  }

  async execute(): Promise<string> {
    const order = this.getOrder();
    if (order.length === 0) return 'Order is already empty.';

    this.onCancel();

    return 'Order has been cancelled and cleared. Let me know if you\'d like to start a new order.';
  }
}

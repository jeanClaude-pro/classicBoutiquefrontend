import { serverUrl } from "../utils/constants";
import type { escPosReceiptData } from "../lib/saleReceipt";

// Thermal (ESC/POS) printing through the server. The payload is built by
// escPosReceiptData (lib/saleReceipt.ts): stored item snapshots, the sale's
// rate snapshot and the receipt labels in the interface language. The server
// prints every amount in FC only (server/utils/receiptLayout.js).
export type PrintReceiptData = ReturnType<typeof escPosReceiptData>;

export class PrintService {
  static async printReceipt(receiptData: PrintReceiptData, type: 'sale' | 'reservation' = 'sale'): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/print/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ receiptData, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to print receipt');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      throw error;
    }
  }

  static async printStub(receiptData: PrintReceiptData, type: 'sale' | 'reservation' = 'sale'): Promise<boolean> {
    try {
      const response = await fetch(`${serverUrl}/print/stub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ receiptData, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to print stub');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Print stub error:', error);
      throw error;
    }
  }

  static async printReceiptAndStub(receiptData: PrintReceiptData, type: 'sale' | 'reservation' = 'sale'): Promise<boolean> {
    try {
      // Print receipt first
      await this.printReceipt(receiptData, type);
      
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Print stub
      await this.printStub(receiptData, type);
      
      return true;
    } catch (error) {
      console.error('Print receipt and stub error:', error);
      throw error;
    }
  }
}

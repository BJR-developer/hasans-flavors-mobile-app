/**
 * Order utility functions for mobile app: parsing notes, delivery addresses, and mobile order tags
 */

export function isMobileOrder(order?: { id?: string | number; notes?: string | null; specialNotes?: string | null } | null): boolean {
  if (!order || order.id === undefined || order.id === null) return false;
  const idStr = String(order.id);
  if (idStr.startsWith('ord_mob_')) return true;
  if (idStr.startsWith('order_')) return false;
  const notes = order.notes || order.specialNotes || '';
  if (notes.includes('Counter POS')) return false;
  if (idStr.startsWith('ord_') || idStr.startsWith('ord-')) return true;
  return false;
}

export function isCashOrderPendingReview(order?: {
  id?: string | number;
  notes?: string | null;
  specialNotes?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
} | null): boolean {
  if (!order) return false;
  if (!isMobileOrder(order)) return false;
  const isCash = order.paymentMethod === 'cash';
  const isUnpaid = order.paymentStatus !== 'paid';
  const isPending = order.status === 'pending' || order.status === 'sent_to_kitchen';
  return isCash && isUnpaid && isPending;
}

export function formatOrderNotes(deliveryAddress?: string, specialNotes?: string, type?: string): string | null {
  const addr = (deliveryAddress || '').trim();
  const notes = (specialNotes || '').trim();

  if (type === 'delivery') {
    if (addr && notes) {
      return `Address: ${addr} | Note: ${notes}`;
    }
    if (addr) {
      return `Address: ${addr}`;
    }
    if (notes) {
      return `Note: ${notes}`;
    }
    return null;
  }

  return notes || null;
}

export function parseOrderNotes(rawNotes: string | null | undefined, type?: string): {
  deliveryAddress?: string;
  specialNotes?: string;
} {
  if (!rawNotes) return { deliveryAddress: undefined, specialNotes: undefined };
  const str = String(rawNotes).trim();
  if (!str) return { deliveryAddress: undefined, specialNotes: undefined };

  let deliveryAddress: string | undefined = undefined;
  let specialNotes: string | undefined = undefined;

  // Structured multi-field format
  if (str.includes('Address:') || str.includes('Note:')) {
    const addrMatch = str.match(/Address:\s*([^|]+)/i);
    const noteMatch = str.match(/Note:\s*([^|]+)/i);

    if (addrMatch) deliveryAddress = addrMatch[1].trim();
    if (noteMatch) specialNotes = noteMatch[1].trim();

    if (!deliveryAddress && type === 'delivery') {
      deliveryAddress = str.replace(/Note:\s*[^|]+/i, '').replace(/[|]/g, '').trim() || undefined;
    }
  } else if (type === 'delivery') {
    deliveryAddress = str;
  } else {
    specialNotes = str;
  }

  return { deliveryAddress, specialNotes };
}

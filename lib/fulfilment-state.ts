export type FulfilmentStatus =
  | 'awaiting_payment'
  | 'paid_pending_review'
  | 'supplier_quote_ready'
  | 'awaiting_owner_approval'
  | 'approved_for_submission'
  | 'submitted_to_supplier'
  | 'supplier_processing'
  | 'shipped'
  | 'delivered'
  | 'exception'
  | 'cancelled';

const TRANSITIONS: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  awaiting_payment: ['paid_pending_review', 'cancelled'],
  paid_pending_review: ['supplier_quote_ready', 'exception', 'cancelled'],
  supplier_quote_ready: ['awaiting_owner_approval', 'exception'],
  awaiting_owner_approval: ['approved_for_submission', 'exception', 'cancelled'],
  approved_for_submission: ['submitted_to_supplier', 'exception'],
  submitted_to_supplier: ['supplier_processing', 'shipped', 'exception'],
  supplier_processing: ['shipped', 'exception'],
  shipped: ['delivered', 'exception'],
  delivered: [],
  exception: ['paid_pending_review', 'awaiting_owner_approval', 'cancelled'],
  cancelled: [],
};

export function transitionFulfilment(
  current: FulfilmentStatus,
  next: FulfilmentStatus,
  options: { verifiedPaid: boolean; ownerApproved: boolean },
): FulfilmentStatus {
  if (!TRANSITIONS[current].includes(next)) {
    throw new Error(`Invalid fulfilment transition: ${current} -> ${next}.`);
  }
  if (next === 'paid_pending_review' && !options.verifiedPaid) {
    throw new Error('A verified paid Shopify order is required.');
  }
  if (next === 'approved_for_submission' && !options.ownerApproved) {
    throw new Error('Explicit owner approval is required before supplier submission.');
  }
  if (next === 'submitted_to_supplier' && !options.ownerApproved) {
    throw new Error('Supplier submission requires a verified owner approval.');
  }
  return next;
}

export const FULFILMENT_AUTOMATION_ENABLED = false;

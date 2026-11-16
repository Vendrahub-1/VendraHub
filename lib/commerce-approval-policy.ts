export type CommerceAction =
  | 'shopify_price_update'
  | 'supplier_purchase'
  | 'inventory_mutation'
  | 'fulfilment_submission'
  | 'refund'
  | 'product_publish';

export type ApprovalRecord = {
  id: string;
  action: CommerceAction;
  resourceId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'consumed';
  approvedBy: string | null;
  approvedAt: string | null;
  expiresAt: string;
  consumedAt: string | null;
};

export function assertOwnerApproval(
  record: ApprovalRecord | null,
  expectedAction: CommerceAction,
  expectedResourceId: string,
  ownerEmail: string | null | undefined,
  now = new Date(),
): asserts record is ApprovalRecord {
  if (!record) throw new Error('A persisted approval record is required.');
  if (record.action !== expectedAction || record.resourceId !== expectedResourceId) {
    throw new Error('Approval does not match this action and resource.');
  }
  if (record.status !== 'approved' || record.consumedAt) {
    throw new Error('A current, unused owner approval is required.');
  }
  if (!ownerEmail || record.approvedBy?.toLowerCase() !== ownerEmail.toLowerCase()) {
    throw new Error('Approval must be recorded by the authenticated owner.');
  }
  const expiry = Date.parse(record.expiresAt);
  const approvalTime = record.approvedAt ? Date.parse(record.approvedAt) : NaN;
  if (!Number.isFinite(expiry) || !Number.isFinite(approvalTime) || expiry <= now.getTime()) {
    throw new Error('Approval is missing a valid timestamp or has expired.');
  }
}

export const COMMERCE_AUTOMATION_DEFAULTS = Object.freeze({
  supplierPurchasesEnabled: false,
  inventoryMutationsEnabled: false,
  fulfilmentSubmissionEnabled: false,
  refundsEnabled: false,
  productPublishingEnabled: false,
  shopifyPriceUpdatesEnabled: false,
});

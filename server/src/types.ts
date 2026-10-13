export type Status = 'processing' | 'needs_review' | 'approved' | 'rejected';
export type Filter = Status | 'decided';
export interface Invoice {
  id: number;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  currency: string;
  invoice_date: string;
  due_date: string;
  description: string;
  status: Status;
  duplicate_of_id: number | null;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
  decision_note: string | null;
}
export type NewInvoice = Pick<
  Invoice,
  | 'invoice_number'
  | 'vendor_name'
  | 'amount'
  | 'currency'
  | 'invoice_date'
  | 'due_date'
  | 'description'
  | 'status'
> &
  Partial<Pick<Invoice, 'flag_reason'>>;
export interface InvoiceDetail extends Invoice {
  original_invoice: Invoice | null;
}

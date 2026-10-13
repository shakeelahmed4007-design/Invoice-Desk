import { z } from 'zod';
export const filterSchema = z
  .object({
    status: z.enum(['processing', 'needs_review', 'approved', 'rejected', 'decided']).optional(),
  })
  .strict();
export const decisionSchema = z
  .object({
    status: z.enum(['approved', 'rejected']),
    note: z.string().trim().max(2000, 'Note must be 2,000 characters or fewer.').optional(),
  })
  .strict();
export const idSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(Number.isSafeInteger);

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Enter a valid calendar date.');
export const invoiceSchema = z
  .object({
    invoice_number: z.string().trim().min(1, 'Invoice number is required.').max(80),
    vendor_name: z.string().trim().min(1, 'Vendor name is required.').max(160),
    amount: z
      .number()
      .int('Amount must be integer cents.')
      .min(1, 'Amount must be positive.')
      .max(99999999999),
    currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR', 'AED']),
    invoice_date: calendarDate,
    due_date: calendarDate,
    description: z.string().trim().min(1, 'Description is required.').max(2000),
    status: z.enum(['processing', 'needs_review']).default('processing'),
    flag_reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((value) => value.due_date >= value.invoice_date, {
    path: ['due_date'],
    message: 'Due date cannot be before invoice date.',
  });

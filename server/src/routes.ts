import { Router } from 'express';
import { InvoiceRepository } from './repository.js';
import { decisionSchema, filterSchema, idSchema, invoiceSchema } from './validation.js';
import { HttpError } from './errors.js';
export function invoiceRoutes(repo: InvoiceRepository) {
  const router = Router();
  router.get('/', (req, res) =>
    res.json({ invoices: repo.list(filterSchema.parse(req.query).status) }),
  );
  router.post('/', (req, res) => {
    const invoice = repo.create(invoiceSchema.parse(req.body));
    res.status(201).location(`/api/invoices/${invoice.id}`).json(invoice);
  });
  router.patch('/:id', (req, res) =>
    res.json(repo.update(Number(req.params.id), invoiceSchema.parse(req.body))),
  );
  router.param('id', (req, _res, next, id: string) => {
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) return next(new HttpError(404, 'Invoice not found.'));
    req.params.id = String(parsed.data);
    next();
  });
  router.get('/:id', (req, res) => res.json(repo.get(Number(req.params.id))));
  router.patch('/:id/status', (req, res) => {
    const body = decisionSchema.parse(req.body);
    res.json(repo.decide(Number(req.params.id), body.status, body.note));
  });
  return router;
}

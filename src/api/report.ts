import { Router, Request, Response } from 'express';
import { ReportEntry } from '../models/reportEntry';
import { ReconciliationRun } from '../models/reconciliationRun';

const router = Router();

//  This route gives full report
router.get('/report/:runId', async (req: Request, res: Response) => {
  const { runId } = req.params;

  const run = await ReconciliationRun.findOne({ runId });
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  const entries = await ReportEntry.find({ runId });
  res.json({ runId, status: run.status, entries });
});

// This route gives just the counts
router.get('/report/:runId/summary', async (req: Request, res: Response) => {
  const { runId } = req.params;

  const run = await ReconciliationRun.findOne({ runId });
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  res.json({ runId, status: run.status, summary: run.summary });
});

// This roote gives only unmatched rows
router.get('/report/:runId/unmatched', async (req: Request, res: Response) => {
  const { runId } = req.params;

  const run = await ReconciliationRun.findOne({ runId });
  if (!run) {
    res.status(404).json({ error: 'Run not found' });
    return;
  }

  const entries = await ReportEntry.find({
    runId,
    category: { $in: ['unmatched_user', 'unmatched_exchange'] },
  });

  res.json({ runId, entries });
});

export default router;
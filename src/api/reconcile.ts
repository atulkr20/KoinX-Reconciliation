import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { ReconciliationRun } from '../models/reconciliationRun';
import { Transaction } from '../models/transaction'; 
import { ingestFiles } from '../ingestion/ingest';
import { matchTransactions } from '../matching/matcher';
import { saveReport, generateCSV } from '../reporting/reporter';

const router = Router();

router.post('/reconcile', async (req: Request, res: Response) => {
  const runId = uuidv4();


  const timestampToleranceSeconds =
    req.body.timestampToleranceSeconds ?? config.matching.timestampToleranceSeconds;
  const quantityTolerancePct =
    req.body.quantityTolerancePct ?? config.matching.quantityTolerancePct;

  // Create the run record immediately so we can track it
  await ReconciliationRun.create({
    runId,
    status: 'processing',
    config: { timestampToleranceSeconds, quantityTolerancePct },
    summary: {
      matched: 0,
      conflicting: 0,
      unmatchedUser: 0,
      unmatchedExchange: 0,
      flaggedRows: 0,
    },
  });

  // Return runId immediately
  res.status(202).json({ runId, status: 'processing' });

  // Run reconciliation asynchronously after response is sent
  try {
    // first Ingest both CSV files into DB
    await ingestFiles(runId);

    // second Load ingested transactions from DB
    const userTxns = await Transaction.find({ runId, source: 'user' });
    const exchangeTxns = await Transaction.find({ runId, source: 'exchange' });

    // Third start the  matching engine
    const results = matchTransactions(userTxns, exchangeTxns, {
      timestampToleranceSeconds,
      quantityTolerancePct,
    });

    // fourth Save report to DB and generate CSV
    await saveReport(runId, results);
    await generateCSV(runId);

    console.log(`Run ${runId} completed successfully`);
  } catch (error) {
    console.error(`Run ${runId} failed:`, error);
    await ReconciliationRun.findOneAndUpdate(
      { runId },
      { status: 'failed', errorMessage: String(error) }
    );
  }
});

export default router;
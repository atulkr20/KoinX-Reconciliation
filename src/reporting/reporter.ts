import fs from 'fs';
import path from 'path';
import { ReportEntry } from '../models/reportEntry';
import { ReconciliationRun } from '../models/reconciliationRun'; 
import { MatchResult } from '../matching/matcher';

export async function saveReport(
  runId: string,
  results: MatchResult[]
): Promise<void> {
  // Save each result as a report entry in MongoDB
  for (const result of results) {
    await ReportEntry.create({
      runId,
      category: result.category,
      reason: result.reason,
      userTransaction: result.userTransaction ? result.userTransaction.toObject() : null,
      exchangeTransaction: result.exchangeTransaction ? result.exchangeTransaction.toObject() : null,
    });
  }

  // Calculate summary counts
  const summary = {
    matched: 0,
    conflicting: 0,
    unmatchedUser: 0,
    unmatchedExchange: 0,
    flaggedRows: 0,
  };

  for (const result of results) {
    if (result.category === 'matched') summary.matched++;
    if (result.category === 'conflicting') summary.conflicting++;
    if (result.category === 'unmatched_user') summary.unmatchedUser++;
    if (result.category === 'unmatched_exchange') summary.unmatchedExchange++;

    // Count flagged rows from reasons
    if (
      result.reason.startsWith('Row flagged during ingestion') ||
      result.reason.startsWith('Row flagged')
    ) {
      summary.flaggedRows++;
    }
  }

  // Update the run with summary and mark completed
  await ReconciliationRun.findOneAndUpdate(
    { runId },
    { status: 'completed', summary }
  );
}

// Flatten a transaction object into CSV-friendly columns with a prefix
function flattenTransaction(
  txn: Record<string, unknown> | null,
  prefix: string
): Record<string, string> {
  if (!txn) {
    return {
      [`${prefix}_id`]: '',
      [`${prefix}_timestamp`]: '',
      [`${prefix}_type`]: '',
      [`${prefix}_asset`]: '',
      [`${prefix}_quantity`]: '',
      [`${prefix}_price_usd`]: '',
      [`${prefix}_fee`]: '',
      [`${prefix}_note`]: '',
    };
  }

  return {
    [`${prefix}_id`]: String(txn['transactionId'] || ''),
    [`${prefix}_timestamp`]: txn['timestamp'] ? new Date(txn['timestamp'] as string).toISOString() : '',
    [`${prefix}_type`]: String(txn['type'] || ''),
    [`${prefix}_asset`]: String(txn['asset'] || ''),
    [`${prefix}_quantity`]: String(txn['quantity'] ?? ''),
    [`${prefix}_price_usd`]: String(txn['priceUsd'] ?? ''),
    [`${prefix}_fee`]: String(txn['fee'] ?? ''),
    [`${prefix}_note`]: String(txn['note'] || ''),
  };
}

export async function generateCSV(runId: string): Promise<string> {
  const entries = await ReportEntry.find({ runId });

  if (entries.length === 0) {
    return '';
  }

  // CSV header
  const headers = [
    'category',
    'reason',
    'user_id',
    'user_timestamp',
    'user_type',
    'user_asset',
    'user_quantity',
    'user_price_usd',
    'user_fee',
    'user_note',
    'exchange_id',
    'exchange_timestamp',
    'exchange_type',
    'exchange_asset',
    'exchange_quantity',
    'exchange_price_usd',
    'exchange_fee',
    'exchange_note',
  ];

  const lines: string[] = [];
  lines.push(headers.join(','));

  for (const entry of entries) {
    const userCols = flattenTransaction(
      entry.userTransaction as Record<string, unknown> | null,
      'user'
    );
    const exchangeCols = flattenTransaction(
      entry.exchangeTransaction as Record<string, unknown> | null,
      'exchange'
    );

    const row = [
      entry.category,
      `"${entry.reason}"`, 
      userCols['user_id'],
      userCols['user_timestamp'],
      userCols['user_type'],
      userCols['user_asset'],
      userCols['user_quantity'],
      userCols['user_price_usd'],
      userCols['user_fee'],
      userCols['user_note'],
      exchangeCols['exchange_id'],
      exchangeCols['exchange_timestamp'],
      exchangeCols['exchange_type'],
      exchangeCols['exchange_asset'],
      exchangeCols['exchange_quantity'],
      exchangeCols['exchange_price_usd'],
      exchangeCols['exchange_fee'],
      exchangeCols['exchange_note'],
    ];

    lines.push(row.join(','));
  }

  // Save CSV to disk under reports/
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const filePath = path.join(reportsDir, `${runId}.csv`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

  console.log(`CSV report saved to ${filePath}`);
  return filePath;
}
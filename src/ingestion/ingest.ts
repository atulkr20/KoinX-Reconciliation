import path from 'path';
import { parseCSV } from './parser';
import { validateAndParse } from './validator';
import { Transaction } from '../models/transaction';

export async function ingestFiles(runId: string): Promise<number> {
    const userFilePath = path.join(process.cwd(), 'data', 'user_transactions.csv');
    const exchangeFilepath = path.join(process.cwd(), 'data', 'exchange_transactions.csv');

    const userRows = parseCSV(userFilePath);
    const exchangeRows = parseCSV(exchangeFilepath);

    let flaggedCount = 0;

    await processRows(runId, userRows, 'user', flaggedCount);
    await processRows(runId, exchangeRows, 'exchange', flaggedCount);

    const flagged= await Transaction.countDocuments({ runId, isFlagged: true});
    console.log(`Ingestion complete. Total flagged rows: ${flagged}`);
    return flagged;
}

async function processRows(
    runId: string,
    rows: Record<string, string>[],
    source: 'user' | 'exchange',
    flaggedCount: number
): Promise<void> {

    // Track sen Transaction id within this file to catch duplicates

    const seenIds = new Set<string>();

    for (const row of rows) {
        const parsed = validateAndParse(row, source);

        //  checking for duplicate transaction id within same source file
        if(parsed.transactionId && seenIds.has(parsed.transactionId)) {
            parsed.isFlagged = true;
            parsed.flagReasons.push(`Duplicate transaction_id: "${parsed.transactionId}"`);
        }

        if(parsed.transactionId) {
            console.log(`[FLAGGED] ${source} row "${parsed.transactionId}": ${parsed.flagReasons.join(', ')}`);
        }

        await Transaction.create ({
            runId,
            source,
            ...parsed,
        });
    }
}
import { ITransaction } from "../models/transaction";
import { typeAreEquivalent } from "../config/typeMapping";

export interface MatchConfig {
    timestampToleranceSeconds: number;
    quantityTolerancePct: number;
}

export interface MatchResult {
    category: 'Matched' | 'conflicting' | 'unmatched_user' | 'unmatched_exchange';
    reason: string;
    userTransaction: ITransaction | null;
    exchangeTransaction: ITransaction | null;
}


// Checking if two timestamps are within tolerance
function timestampsMatch(a: Date, b: Date, toleranceSeconds: number): boolean {

    const diffSeconds = Math.abs(a.getTime() - b.getTime()) / 1000;
    return diffSeconds <= toleranceSeconds;
}

//  Checkinfg if two qunatities are within tolerance percentage
function quantitiesMatch(a: number, b: number, tolerancePct: number): boolean {
    if( a === 0 && b === 0) return true;
    if (a === 0 || b === 0) return false;
    const diffPct = Math.abs(a-b) / Math.max(a, b) * 100;
    return diffPct <= tolerancePct;
}

export function matchTransactions(
    userTxns: ITransaction[],
    exchangeTxns: ITransaction[],
    config: MatchConfig
): MatchResult[] {
    const results: MatchResult[] = [];

    const matchedExchangeIds = new Set<string>();

    for (const userTxn of userTxns) {

        // skipping flagged rows they can't be reliably matched
    if(userTxn.isFlagged) {
        results.push({
            category: 'unmatched_user',
            reason: `Row flagged during ingestion: ${userTxn.flagReasons.join(', ')}`,
            userTransaction: userTxn,
            exchangeTransaction: null,
        });
        continue;
    
    }

    // candidates = same asset + equivalent type + not already matched
    // Here we will find all exchange txns that are candidates for this user txn
    const candidates = exchangeTxns.filter((exTxn) => {
        if(matchedExchangeIds.has(exTxn._id.toString())) return false;
        if (exTxn.asset !== userTxn.asset) return false;
        if(!typeAreEquivalent(userTxn.type, exTxn.type))  return false;
        return true;

    });

    if (candidates.length === 0) {
        results.push({
            category: 'unmatched_user',
            reason: 'No exchange transaction found with matching asset and type',
            userTransaction: userTxn,
            exchangeTransaction: null,
        });
        continue;
    }

// Finding best match among candidates 
    let bestMatch: ITransaction | null = null;
    let bestDiff = Infinity;

    for (const candidate of candidates) {
      if (!userTxn.timestamp || !candidate.timestamp) continue;

      const diff = Math.abs(
        userTxn.timestamp.getTime() - candidate.timestamp.getTime()
      ) / 1000;

      if (diff <= config.timestampToleranceSeconds && diff < bestDiff) {
        bestDiff = diff;
        bestMatch = candidate;
      }
    }

    if (!bestMatch) {
      results.push({
        category: 'unmatched_user',
        reason: 'No exchange transaction found within timestamp tolerance',
        userTransaction: userTxn,
        exchangeTransaction: null,
      });
      continue;
    }
    // When we have a cnadidate match then check qunatity
    const userQty = userTxn.quantity ?? 0;
    const exQty = bestMatch.quantity ?? 0;
    const qtyMatches = quantitiesMatch(userQty, exQty, config.quantityTolerancePct);

    if (qtyMatches) {
      results.push({
        category: 'Matched',
        reason: 'Asset, type, timestamp, and quantity all within tolerance',
        userTransaction: userTxn,
        exchangeTransaction: bestMatch,
      });
    } else {
      const diffPct = Math.abs(userQty - exQty) / Math.max(userQty, exQty) * 100;
      results.push({
        category: 'conflicting',
        reason: `Quantity mismatch: user=${userQty}, exchange=${exQty}, diff=${diffPct.toFixed(4)}%`,
        userTransaction: userTxn,
        exchangeTransaction: bestMatch,
      });
    }

    // Mark this exchange txn as  used regardless of matched or conflicting
    matchedExchangeIds.add(bestMatch._id.toString());
    }
    // Noe whatever is left in the exchange file was never matched
}

 for (const exTxn of exchangeTxns) {
    if (matchedExchangeIds.has(exTxn._id.toString())) continue;
    if (exTxn.isFlagged) {
      results.push({
        category: 'unmatched_exchange',
        reason: `Row flagged during ingestion: ${exTxn.flagReasons.join(', ')}`,
        userTransaction: null,
        exchangeTransaction: exTxn,
      });
      continue;
    }
    results.push({
      category: 'unmatched_exchange',
      reason: 'No matching user transaction found',
      userTransaction: null,
      exchangeTransaction: exTxn,
    });
  }

  return results;
}
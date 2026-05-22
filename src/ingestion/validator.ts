import { normaliseAsset } from '../config/assetAliases';

export interface ParsedTransaction {
    transactionId: string;
    timestamp: Date | null;
    type: string;
    asset: string;
    quantity: number | null;
    priceUsd: number | null;
    fee: number | null;
    note: string;
    isFlagged: boolean;
    flagReasons: string[];
    rawRow: Record<string, string>;
}

export function validateAndParse(
    row: Record<string, string>,
    source: 'user' | 'exchange'
): ParsedTransaction {
    const flagReasons: string[] = [];

    // Transaction ID

    const transactionId = row['transaction_id']?.trim() || '';
    if(!transactionId) {
        flagReasons.push('Missing transaction_id');
    }

// Timestamp

    let timestamp: Date | null = null;
    const rawTimestamp = row['timestamp']?.trim() || '';
    if(!rawTimestamp) {
        flagReasons.push('missing timestamp');
    } else {
        const parsed = new Date(rawTimestamp);
        if(isNaN(parsed.getTime())) {
            flagReasons.push(`Invalid timestamp: "${rawTimestamp}"`);
        } else {
            timestamp = parsed;
        }
    }

    // Type

    const type = row['type']?.trim().toUpperCase() || '';
    if(!type) {
        flagReasons.push('Missing type');
    }

    // Asset 
    const rawAsset = row['asset']?.trim() || '';
    if(!rawAsset) {
        flagReasons.push('Missing Asset');
    }
    const asset = rawAsset ? normaliseAsset(rawAsset): '';

    // quantity
    let quantity: number | null = null;
    const rawQty = row['quantity']?.trim() || '';
    if(!rawQty) {
        flagReasons.push('missing quantity');
    } else {
        const parsed = parseFloat(rawQty);
        if(isNaN(parsed)) {
            flagReasons.push(`invalid quantity: "${rawQty}"`);
        } else if (parsed < 0) {
            flagReasons.push(`Negative quantity: "${rawQty}"`);
        } else {
            quantity = parsed;
        }
    }

    // usd price

    let priceUsd: number | null = null;
    const rawPrice = row['price_usd']?.trim() || '';
    if(rawPrice) {
        const parsed = parseFloat(rawPrice);
        if(!isNaN(parsed)) {
            priceUsd = parsed;

        }
    }

// fee
let fee: number | null = null;
const rawFee = row['fee']?.trim() || '';
if(rawFee) {
    const parsed = parseFloat(rawFee);
    if(!isNaN(parsed)) {
        fee = parsed;
    }
}
// note 
const note = row['note']?.trim() || '';

return {
    transactionId,
    timestamp,
    type,
    asset,
    quantity,
    priceUsd,
    fee,
    note,
    isFlagged: flagReasons.length > 0,
    flagReasons,
    rawRow: row,
};

}
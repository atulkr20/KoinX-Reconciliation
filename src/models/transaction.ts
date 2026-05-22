import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
    runId: string;
    source: 'user' | 'exchange';
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

const TransactionSchema = new Schema <ITransaction> ({
    runId: { type: String, required: true, index: true },
    source: { type: String, enum: ['user', 'exchange'], required: true},
    transactionId: { type: String, required: true },
    timestamp: { type: Date, default: null },
    type: { type: String, default: ''},
    asset: { type: String, default: ''},
    quantity: { type: Number, default: null},
    priceUsd: { type: Number, default: null},
    fee: { type: Number, default: null},
    note: { type: String, default: ''},
    isFlagged: {type: Boolean, default: false},
    flagReasons: { type: [String], default: []},
    rawRow: { type: Schema.Types.Mixed, required: true},
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
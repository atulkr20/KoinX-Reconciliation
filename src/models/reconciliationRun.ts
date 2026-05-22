import mongoose, {Document, Schema} from 'mongoose';

export interface IReconciliationRun extends Document {
    runId: string;
    createdAt: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    config: {
        timestampToleranceSeconds: number;
        qunatityTolerancePct: number;
    };

    summary: {
        matched: number;
        conflicting: number;
        unmatchedUser: number;
        unmatchedExchange: number;
        falggedRows: number;
    };
    errorMessage?: string;
}

const ReconciliationRunSchema = new Schema<IReconciliationRun>({
    runId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now},
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending', 
    },
    config: {
        timeStampToleranceSeconds: { type: Number, required: true },
        qunaittyTolerancePct: { type: Number, required: true},
    },
    summary: {
        matched: { type: Number, default: 0},
        conflicting: { type: Number, default: 0},
        unmatchedUser: { type: Number, default: 0},
        unmatchedExchange: { type: Number, default: 0},
        flaggedRows: { type: Number, default: 0},

    },
    errorMessage: { type: String},

});

export const ReconciliationRun = mongoose.model<IReconciliationRun>(
    'ReconciliationRun',
    ReconciliationRunSchema
);
import mongoose, { Document, Schema } from 'mongoose';

export interface IReportEntry extends Document {
    runId: string;
    category: 'matched' | 'conflicting' | 'unmatched_user' | 'unmatched_exchange';
    reason: string;
    userTransaction: Record<string, unknown> | null;
    exchangeTransaction: Record<string, unknown> | null;
}

const ReportEntrySchema = new Schema<IReportEntry>({
    runId: { type: String, required: true, index: true}, 
    category: {
        type: String,
        enum: ['matched', 'conflicting', 'unmatched_user', 'unmatched_exchange'],
        required: true,

    },
    reason: { type: String, required: true}, 
    userTransaction: { type: Schema.Types.Mixed, default: null}, 
    exchangeTransaction: { type: Schema.Types.Mixed, default: null},
});

export const ReportEntry = mongoose.model<IReportEntry>('ReportEntry', ReportEntrySchema);

import mongoose from 'mongoose';

const AccessLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export const AccessLogModel = mongoose.model('AccessLog', AccessLogSchema);

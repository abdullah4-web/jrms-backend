import mongoose from 'mongoose';

const { Schema } = mongoose;

const tenantActionSchema = new Schema({
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    tenant: {
        type: Schema.Types.ObjectId,
        ref: 'Tenant'
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property'
    },
    floor: {
        type: Schema.Types.ObjectId,
        ref: 'Floor'
    },
    unit:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'Unit'
            },
        ],

    pdc: [{
        checkNumber: String,
        isTransfter: { type: Boolean, default: false },
        bank: String,
        date: Date,
        amount: Number,
        pdcstatus: { type: String, default: 'ontime' },
        submissiondate: { type: Date, default: null },
        type: { type: String, default: 'full' },
        remarks: { type: String, default: null }
    }],
    payment: [{
        paymentmethod: String,
        paymentstatus: String,
        amount: Number,
        bank: String,
        checkorinvoice: String,
        date: Date,
        submissiondate: { type: Date, default: new Date() },
        collectiondate: { type: Date, default: null },
        type: { type: String, default: 'full' },
        remarks: { type: String, default: null }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const TenantAction = mongoose.model('TenantAction', tenantActionSchema);

export default TenantAction;

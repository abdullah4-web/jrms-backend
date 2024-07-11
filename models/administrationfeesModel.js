import mongoose from 'mongoose';

const { Schema } = mongoose;

const administrationFeeSchema = new Schema({
    tenantId: {
        type: Schema.Types.ObjectId, 
        ref: 'Tenant',
        required: true
    },
    contractIssuingFees: Number,
    ejariFee: Number,
    transferFees: Number,
    terminationFees: Number,
    contractExpiryFees: Number,
    maintenanceSecurityDeposit: Number,
    refundableGuarantee: Number,
    lateRenewalFees: Number,
    postponeChequeFees: Number
}, { timestamps: true });

const AdministrationFee = mongoose.model('AdministrationFee', administrationFeeSchema);

export default AdministrationFee;

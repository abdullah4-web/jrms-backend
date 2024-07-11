import mongoose from 'mongoose';

const { Schema } = mongoose;
const today = new Date(); // Get today's date


const tenantSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    contact: String,
    nid: String,
    nationality: String,
    licenseno: String,
    companyname: String,
    passport: String,
    address: String,
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property'
    },
    floorId: {
        type: Schema.Types.ObjectId,
        ref: 'Floor'
    },
    unitId: [{
        type: Schema.Types.ObjectId,
        ref: 'Unit'
    }],
    propertyType: {
        type: String,

        required: true
    },
    contractInfo: {
        startingDate: {
            type: Date,
            required: true
        },
        securitydeposite: String,
        depositecash: Number,
        depositechk: String,
        depositeamount: Number,
        depositeDate: {
            type: Date
        },
        graceperiod: String,
        numberofoccupants: String,
        Waterandelecbill: {
            type: String,


        },
        pet: Boolean,
        usage: {
            type: String,

        },
        monthsDuration: {
            type: Number,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        totalContractAmount: {
            type: Number,
            required: true
        },
        VAT: {
            type: Number,
        },
        otherCost: Number,
        parking: Boolean,
        parkingValue: Number,
        discount: Number,
        finalAmount: {
            type: Number,
            required: true
        },
        paidAmount: Number,
        bank: String,
        totalChecks: {
            type: Number,
            required: true
        },
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
            submissiondate: { type: Date, default: today },
            collectiondate: { type: Date, default: null },
            type: { type: String, default: 'full' },
            remarks: { type: String, default: null }
        }]
    },
    status: {
        type: String,
        enum: ['Active', 'Case','Cancel'],
        default: 'Active'
    },
    contractNo: {
        type: String,
        unique: true,
    },
}, { timestamps: true });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;

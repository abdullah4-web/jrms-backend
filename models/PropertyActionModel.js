// PropertyActionModel.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const propertyActionSchema = new Schema({
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
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property'
    },
    timestamp: { 
        type: Date,
        default: Date.now
    }
});

const PropertyAction = mongoose.model('PropertyAction', propertyActionSchema);

export default PropertyAction;

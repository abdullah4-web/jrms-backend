import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminActionSchema = new Schema({
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
    // Reference to either Property or Tenant
    entity: {
        type: Schema.Types.ObjectId,
        refPath: 'entityType' // Dynamically determine the referenced model
    },
    // Determine the type of entity
    entityType: {
        type: String,
        enum: ['Property', 'Tenant'] // Specify the possible values
    },
    timestamp: { 
        type: Date,
        default: Date.now
    }
});

const AdminAction = mongoose.model('AdminAction', adminActionSchema);

export default AdminAction;

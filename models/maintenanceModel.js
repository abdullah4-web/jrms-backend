import mongoose from 'mongoose';

const { Schema } = mongoose;

const maintenanceSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: async function (userId) {
                const User = mongoose.model('User');
                const user = await User.findById(userId);
                return user && user.role === 'owner';
            },
            message: 'User does not have owner role.'
        }
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property'
    },
    floor: {
        type: Schema.Types.ObjectId,
        ref: 'Floor'
    },
    unit: {
        type: Schema.Types.ObjectId,
        ref: 'Unit'
    },
    maintenanceType: {
        type: String,
        required: true
    },
    image: String,
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;

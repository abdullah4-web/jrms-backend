import mongoose from 'mongoose';

const { Schema } = mongoose;

const floorSchema = new Schema({
    name: String,
    units: [{
        type: Schema.Types.ObjectId,
        ref: 'Unit'
    }],
    DelStatus: {type : Boolean , default:false}
});

const Floor = mongoose.model('Floor', floorSchema);

export default Floor;

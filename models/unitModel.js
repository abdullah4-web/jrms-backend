import mongoose from 'mongoose';

const { Schema } = mongoose;

const unitSchema = new Schema({
    type: {
        type: String,
      //  enum: ['Studio', '1BHK', '2BHK', '3BHK', 'Penthouse','Office'] 
    },
    occupied: {
        type: Boolean,
        default: false
    },
    premiseNo: String,
 
    unitRegNo: String,
    unitNo: String,
    DelStatus: {type : Boolean , default:false}
});

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;

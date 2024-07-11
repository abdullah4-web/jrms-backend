import mongoose from 'mongoose';

const { Schema } = mongoose;

const propertySchema = new Schema({
    name: String,
    user: {
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
    cname: String,
    ccontact: String,
    cemail: String, 
    address: String,
    contactinfo: String,
    propertyImage: String,
    status: {
        type: String,
        enum: ['Enable', 'Disable'],
        default: 'Enable'
    },
    propertyType: {
        type: String,
      
    },
    municipality: String, 
    zone: String, 
    sector: String, 
    roadName: String, 
    plotNo: String, 
    plotAddress: String,
    onwaniAddress: String, 
    propertyNo: String, 
    propertyRegistrationNo: String, 
    floors: [{
        type: Schema.Types.ObjectId,
        ref: 'Floor'
    }],
  
    city: String,
    area: String,
    bondtype: String,
    bondno: String,
    bonddate: String,
    govermentalno: String,
    pilotno: String,
    buildingname: String,
    nameandstreet: String,
    propertytype: String,
    description: String,
    propertyno:String,
    joveracommission:Number,
    DelStatus: {type : Boolean , default:false}
});

const Property = mongoose.model('Property', propertySchema);

export default Property;

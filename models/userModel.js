import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'superadmin', 'owner'],
      required: true, 
    },
    picture: { type: String, required: true },
    contact: { type: String },
    othercontact:{ type: String},
    address : {type: String},
    nationality: { type: String },
    emid: { type: String , },

    otp: { type: String },
    DelStatus: {type : Boolean , default:false}
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;

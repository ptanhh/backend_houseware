import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const User = new Schema({
    name:{type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    address: {type:String},
    phone: {type: String},
    isAdmin: {type: Boolean},
    avatar: {type: String}
},
{
    timestamps: true,
  },
)

export const UserModel = mongoose.model('User', User)
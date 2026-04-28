import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    columns: {
        type: [String],
        default: ['To Do', 'In Progress', 'Done']
    }
},{timestamps:true});
// mongoose.models.user important for hot relaoding in next js
const User = mongoose.models.User || mongoose.model('User',UserSchema);
export default User;
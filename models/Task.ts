// import mongoose, { Schema, model, models } from 'mongoose';

// const TaskSchema = new Schema({
//   title: { type: String, required: true },
//   description: { type: String },
//   completed: { type: Boolean, default: false },
//   priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
// }, { timestamps: true });

// // This "models.Task ||" part is crucial in Next.js because of hot-reloading
// const Task = models.Task || model('Task', TaskSchema);
// export default Task;


import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    completed:{
        type:Boolean,
        default:false
    },
    priority:{
        type:String,
        enum:['low','medium','high'],
        default:'medium'
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
},{timestamps:true});           

// This "models.Task ||" part is crucial in Next.js because of hot-reloading
const Task = mongoose.models.Task || mongoose.model('Task',TaskSchema);
export default Task;


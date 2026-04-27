import mongoose from 'mongoose';


export default async function MongoDB(): Promise<void>{
try{

 // 1. Check if we already have a connection (0 = disconnected, 1 = connected, 2 = connecting)
    if (mongoose.connection.readyState >= 1) {
      console.log("Using existing MongoDB connection");
      return;
    }
    if(!process.env.MONGO_URI){
        throw new Error('MONGO_URI is not defined');
    }
    const MONGO_URI = process.env.MONGO_URI.replace('mongodb://localhost', 'mongodb://127.0.0.1');
    const con = await mongoose.connect(MONGO_URI);
    console.log(`connected to MongoDB at host: ${con.connection.host} and DB Name is: ${con.connection.name}`)
}
catch(error){
    console.error('Error connecting to MongoDB:', error);
}


}
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Connect to the MongoDB cluster
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true
      }
    });

    // Send a ping to confirm a successful connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('MongoDB connected successfully 🎉');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
}

export default connectDB;
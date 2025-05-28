import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '', {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      maxPoolSize: 50,
    });
  } catch (err) {
    process.exit(1);
  }
};

export default connectDB; 
const app = require('./config/app');
const connectDB = require('./config/connect');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB(process.env.LOCAL_DB);
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
}
startServer();
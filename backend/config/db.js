const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables
mongoose.set("strictQuery", false);

const connectDB = async () => {
	try {
		const mongoURI = process.env.MONGODB_URI;
		
		if (!mongoURI) {
			throw new Error("MONGODB_URI environment variable is not defined");
		}
		
		const conn = await mongoose.connect(mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			retryWrites: true,
			w: "majority",
			maxPoolSize: 10,
			socketTimeoutMS: 45000,
			serverSelectionTimeoutMS: 30000,
			keepAlive: true,
			keepAliveInitialDelay: 300000,
		});
		
		console.log("");
		console.log("Connected to DB");
	} catch (error) {
		console.error("Error connecting to DB:", error);
		process.exit(1);
	}
};

module.exports = connectDB;

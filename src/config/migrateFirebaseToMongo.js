// Import necessary libraries
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { MongoClient } from "mongodb";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBO3elV076LfV7dxwL-AzMyaFPahPz_GTI",
    authDomain: "plateshare-debe4.firebaseapp.com",
    databaseURL: "https://plateshare-debe4-default-rtdb.firebaseio.com",
    projectId: "plateshare-debe4",
    storageBucket: "plateshare-debe4.appspot.com",
    messagingSenderId: "675782368793",
    appId: "1:675782368793:web:8ccc633cb0619016fe5488"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// MongoDB configuration
const mongoUri = "mongodb+srv://Kiruthihashree:1234@merncluster.epjqct6.mongodb.net/?retryWrites=true&w=majority&appName=MERNCluster"; // replace with your MongoDB connection string
const dbName = "FoodShare"; // replace with your MongoDB database name
const collectionName = "Users"; // replace with your MongoDB collection name

async function migrateData() {
  try {
    // Initialize MongoDB client
    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Reference to the Firebase Realtime Database root
    const dbRef = ref(database);

    // Fetch data from Firebase
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Process and insert data into MongoDB
      const documents = Object.keys(data).map(key => ({
        ...data[key],
        _id: key  
      }));

      // Insert data into MongoDB
      await collection.insertMany(documents);
      console.log("Data migrated successfully!");

    } else {
      console.log("No data available in Firebase.");
    }

    // Close the MongoDB connection
    await client.close();
  } catch (error) {
    console.error("Error migrating data:", error);
  }
}

// Execute the migration
migrateData();

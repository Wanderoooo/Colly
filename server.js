import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

const url = process.env.MONGODB_URL;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const app = express();
const httpServer = createServer(app);
app.use(cors());

const saveToDatabaseDelay = 5000; // 5s save delay
let pendingTextChange = "";
const client = new MongoClient(url, options);

const startServer = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    httpServer.listen(4000, () => {
      console.log('Server running at http://localhost:4000');
    });

    const io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('getTextById', async (id) => {
        try {
          const database = client.db('Colly');
          const collection = database.collection('Texts');

          // Use ObjectID to convert the string ID to MongoDB ObjectID
          const objectId = new ObjectID(id);

          // Find the document by ID
          const text = await collection.findOne({ _id: objectId });

          if (text) {
            socket.emit('textChange', text);
          } else {
            socket.emit('textChange', { error: 'Text not found' });
          }

        } catch (error) {
          console.error('Error fetching text by ID from MongoDB:', error);
          // Handle error as needed
        }
      });

      socket.on('textChange', (newText) => {
        console.log('Text changed:', newText);
        pendingTextChange = newText;
        io.emit('textChange', newText);
      });

      socket.on('getData', async () => {
        const database = client.db('Colly');
        const collection = database.collection('Texts');
        const data = await collection.find({}).toArray();
        socket.emit('data', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
      
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

setInterval(async () => {
  if (pendingTextChange !== null) {
    const database = client.db('Colly');
    const collection = database.collection('Texts');
    await collection.insertOne({ text: pendingTextChange, timestamp: new Date() });

    console.log('Text saved to the database:', pendingTextChange);
  }
}, saveToDatabaseDelay);

startServer();





io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  

});
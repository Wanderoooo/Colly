import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

const url = "mongodb+srv://alissalol:MooMooMilk123@colly.ogxeusv.mongodb.net/?retryWrites=true&w=majority";
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const app = express();
const httpServer = createServer(app);
app.use(cors());

const saveToDatabaseDelay = 5000; // 5s save delay
let pendingTextChange = null;
let textId = null;
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

          const objectId = new ObjectId(id);
          const text = await collection.findOne({ _id: objectId });
          console.log(text);

          if (text) {
            textId = text._id;
            socket.emit('textChange', text.paragraph);
          }

        } catch (error) {
          console.error('Error fetching text by ID from MongoDB:', error);
          // Handle error
        }
      });

      socket.on('textChange', (newText) => {
        pendingTextChange = newText;
        io.emit('textChange', newText); // need to broadcast to clients with id
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
    const filter = { _id: textId };
    const update = {
      $set: {
        paragraph: pendingTextChange,
      },
    };

    const result = await collection.updateOne(filter, update);

    console.log('Text saved to the database:', pendingTextChange);
    pendingTextChange = null;
  }
}, saveToDatabaseDelay);

startServer();
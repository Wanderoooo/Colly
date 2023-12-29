import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
let updateMap = new Map();

const url = "mongodb+srv://alissalol:MooMooMilk123@colly.ogxeusv.mongodb.net/?retryWrites=true&w=majority";
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const app = express();
const httpServer = createServer(app);
app.use(cors());

const saveToDatabaseDelay = 5000; // 5s save delay
const client = new MongoClient(url, options);

const startServer = async () => {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    httpServer.listen(4000, () => {
      console.log('Server running at http://localhost:4000');
    });

    const io = new Server(httpServer, {
      connectionStateRecovery: {},
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Access-Control-Allow-Origin"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      // emit to where? socket.broadcast.emit('userConnected');

      socket.on('getTextById', async (id) => {
        try {

          const database = client.db('Colly');
          const collection = database.collection('Texts');

          const objectId = new ObjectId(id);
          const text = await collection.findOne({ _id: objectId });
          console.log(text);
          socket.join(id);
        
          if (text) {
            io.to(id).emit('textChange', text.paragraph);
          }

        } catch (error) {
          console.error('Error fetching text by ID from MongoDB:', error);
          // Handle error!
        }
      });

      socket.on('textChange', ({newText, idRef}) => {
        updateMap.set(idRef, newText);
        socket.to(idRef).emit('textChange', newText);
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
  const database = client.db('Colly');
  const collection = database.collection('Texts');

  updateMap.forEach((value, key) => {
    let textId = new ObjectId(key);
    const filter = { _id: textId };
    const update = {
      $set: {
        paragraph: value,
      },
    };

    collection.updateOne(filter, update);
    console.log('Text saved to the database:', value);
  });

  updateMap.clear();

}, saveToDatabaseDelay);

startServer();
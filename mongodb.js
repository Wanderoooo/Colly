import { MongoClient } from "mongodb";

const url = process.env.MONGODB_URL;

const options={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}

let client = new MongoClient(url, options);
let clientPromise = client.connect();

export default clientPromise;
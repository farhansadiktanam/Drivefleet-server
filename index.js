/////////////////////////////////////
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");

const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("drivefleet");
    const carCollection = db.collection("cars");

    app.get("/cars", async (req, res) => {
      const result = await carCollection.find().toArray();
      res.send(result);
    });

    app.get("/cars/:carId", async (req, res) => {
      const { carId } = req.params;
      const result = await carCollection.findOne({ _id: new ObjectId(carId) });
      res.send(result);
    });

    app.post("/cars", async (req, res) => {
      const carData = req.body;
      const result = await carCollection.insertOne(carData);
    });

    app.patch("/cars/:carId", async (req, res) => {
      const { carId } = req.params;
      const editedData = req.body;
      const result = await carCollection.updateOne(
        { _id: new ObjectId(carId) },
        { $set: editedData },
      );
      res.send(result);
    });

    app.delete("/cars/:carId", async (req, res) => {
      const { carId } = req.params;
      const result = await carCollection.deleteOne({
        _id: new ObjectId(carId),
      });

      res.send(result);
    });

    app.get("/featured-cars", async (req, res) => {
      const result = await carCollection.find().limit(3).toArray();
      res.send(result);
    });
  } catch (error) {
    console.error("MongoDB connection faild:", error);
    process.exit(1);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

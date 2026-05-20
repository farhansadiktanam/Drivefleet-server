/////////////////////////////////////
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

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

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHeader = await req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);

    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();
    const db = client.db("drivefleet");
    const carCollection = db.collection("cars");
    const carBookingCollection = db.collection("carbooking");

    app.get("/cars", async (req, res) => {
      const result = await carCollection.find().toArray();
      res.send(result);
    });

    app.get("/cars/:carId", verifyToken, async (req, res) => {
      const { carId } = req.params;
      const result = await carCollection.findOne({
        _id: new ObjectId(carId),
      });
      res.send(result);
    });

    app.post("/cars", verifyToken, async (req, res) => {
      const carData = req.body;
      const result = await carCollection.insertOne(carData);
      res.send(result);
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

    app.post("/my-bookings", verifyToken, async (req, res) => {
      const carBookingData = req.body;
      const result = await carBookingCollection.insertOne(carBookingData);

      res.send(result);
    });

    app.get("/my-bookings/:userId", async (req, res) => {
      const { userId } = req.params;
      const result = await carBookingCollection.find({ userId }).toArray();
      res.send(result);
    });

    app.delete("/my-bookings/:bookingId", async (req, res) => {
      const { bookingId } = req.params;
      const result = await carBookingCollection.deleteOne({
        _id: new ObjectId(bookingId),
      });
      res.send(result);
    });

    /////////////////////////
    //////
  } catch (error) {
    console.error("MongoDB connection faild:", error);
    process.exit(1);
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

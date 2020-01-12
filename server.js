require("dotenv").config();

const { MongoClient } = require("mongodb");
const { promisify } = require("util");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const fetch = require("node-fetch");
const Joi = require("@hapi/joi");
const parser = promisify(require("xml2js").parseString);
const path = require("path");

const publicFolder = path.resolve(__dirname, "public");
const MONGODB_URI = process.env.MONGODB_URI;
let CACHE = {};

const app = express();

function setCacheData(data) {
  CACHE.data = data;
  CACHE.timestamp = Date.now();
}

function getCacheData() {
  let now = Date.now();
  let timeout = 10000 * 60 * 5; // 5 minutes
  if (CACHE.timestamp && now - CACHE.timestamp <= timeout) {
    console.log(">>> Cache Hit");
    return CACHE.data;
  }

  console.log(">>> Cache Miss");
  return null;
}

const PLACE_STYLE = {
  "#0": "Servicios de Salud",
  "#1": "Alimento y/o Suministros",
  "#2": "Refugio / Campamento"
};

async function getBatchGeoData() {
  let cacheHit = getCacheData();
  if (cacheHit) {
    return cacheHit;
  }

  let response = await fetch(
    "https://batchgeo.com/map/kml/de8ab2455315ad6fa4b05522d88c3ed6"
  );
  let body = await response.text();
  let data = await parser(body);

  let document = data.kml.Document[0];
  let name = document.name[0];
  let places = document.Placemark;

  let cleanData = places.map((place) => {
    let coords = "";
    if (place.Point[0].coordinates) {
      coords = place.Point[0].coordinates[0]
        .split(",")
        .reverse()
        .slice(1)
        .join(",");
    }
    return {
      need: PLACE_STYLE[place.styleUrl],
      address: place.address[0],
      name: place.name[0],
      location: coords,
      data: place.ExtendedData[0].Data.filter(
        (d) => ["Necesidades", "Contactos"].indexOf(d.$.name) > -1
      ).map((d) => {
        return { key: d.$.name, value: d.value[0] };
      })
    };
  });

  setCacheData(cleanData);
  return cleanData;
}

async function getDbData(Reports) {
  let data = await Reports.find({}).toArray();
  let result = data.map((r) => {
    let obj = {
      name: r.name,
      need: r.category,
      address: r.address,
      data: []
    };
    if (r.necesidades) {
      obj.data.push({ key: "Necesidades", value: r.necesidades });
    }

    if (r.contactos) {
      obj.data.push({ key: "Contactos", value: r.contactos });
    }
    return obj;
  });

  return result;
}

async function main() {
  let client = await MongoClient.connect(MONGODB_URI, {
    useUnifiedTopology: true
  });
  let db = client.db("sos-sur");
  let Reports = db.collection("Reports");

  app.use(cors());
  app.use(bodyParser.json());

  app.use(express.static(publicFolder));

  app.get("/data.json", async (req, res) => {
    let dbData = await getDbData(Reports);
    let apiData = await getBatchGeoData();
    let result = dbData.concat(apiData);
    res.json(result);
  });

  app.post("/api/reports", async (req, res) => {
    let data = req.body;

    // Define body schema
    const schema = Joi.object({
      name: Joi.string()
        .max(255)
        .required(),
      category: Joi.string()
        .max(255)
        .required(),
      address: Joi.string()
        .max(255)
        .required(),
      necesidades: Joi.string().max(255),
      contactos: Joi.string().max(255)
    });

    let cleanData = null;

    try {
      cleanData = await schema.validateAsync(data);
    } catch (error) {
      console.error("-> Invalid request body", error);
      res.status(400).json({ success: false, error });
      return;
    }

    try {
      let result = await Reports.insertOne(cleanData);
      console.log("-> Report created", cleanData);
      res.json({ success: true, result: result.ops[0] });
    } catch (error) {
      console.error("-> Error saving to db", cleanData);
      res.status(400).json({ success: false });
    }
  });

  app.listen(process.env.PORT || 3000, () => {
    console.log("-> Listening on port 3000...");
  });
}

main();

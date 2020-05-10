const express = require("express");
const bodyParser = require("body-parser");
import * as dotenv from "dotenv";
import { createConnection, Connection } from "typeorm";
const cors = require("cors");
const helmet = require("helmet");

// import { logger } from './logging'
// import { config } from "./config";
import * as defaultInserts from "./util/DefaultInserts";

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env" });

const xlogger = function (req, res, next) {
  console.log(req.method + " " + req.url);
  next();
};

console.log("Starting Node App");

createConnection()
  .then(() => {
    console.log("Connected!");

    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(helmet());
    app.use(xlogger);

    app.use(
      cors({
        origin: "*",
      })
    );

    app.use("/", require("./routes/insecure"));
    app.use("/api/", require("./routes/secure"));

    defaultInserts.rolesInsert();

    console.log("Starting Express App");
    const server = app.listen(process.env.port, function () {
      const host = server.address().address;
      const port = server.address().port;
      console.log("REST api listening at https://localhost.ppm.com:" + port);
    });
    module.exports = app;
    // await connection.close();
  })
  .catch((e) => {
    console.error(e);
  });

console.log("End of server.ts");

import * as express from "express";
const jwtAuthz = require("express-jwt-authz");
var jwtDecode = require("jwt-decode");

export default class PingController {
  public static async ping(req: express.Request, res: express.Response, next) {
    const orgID: string = req.query.org_id;
    // console.log("orgid", orgID);

    const token: string = req.headers["authorization"];
    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    // console.log("userId", userId);

    const createdBy = "";
    const toEmail = req.body.email;
    const createdDate = new Date();

    const foo = "bar";
    res.status(200).send("pong");
  }
}

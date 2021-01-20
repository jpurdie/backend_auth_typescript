import * as express from "express";
export default class PingController {
  public static async ping(req: express.Request, res: express.Response, next) {
    res.status(200).send("pong");
  }
}

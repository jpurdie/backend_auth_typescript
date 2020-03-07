import * as express from "express";
const { validationResult, body } = require("express-validator");

export default class PingController {
  public static async create(
    req: express.Request,
    res: express.Response,
    next
  ) {
    res.status(418);
    res.send("create");
  }

  public static validate(method: String) {
    switch (method) {
      case "create": {
        return [
          body("email", "Invalid email")
            .exists()
            .isEmail()
        ];
      }
    }
  }
}

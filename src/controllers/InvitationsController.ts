import * as express from "express";
const { validationResult, body } = require("express-validator");
import { Invitation } from "./../entity/Invitation";

export default class InvitationsController {
  public static async create(req: express.Request, res: express.Response) {
    console.log("inside Inviations create");

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array()
      });
    }

    const user = req["user"];
    console.log(user);
    const sub = user.sub; // auth0 unique ID

    // need to get org based on external ID

    let invite = new Invitation();
    invite.email = req.body.email;
    invite.createdDate = new Date();
    invite.expiration = new Date(
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000
    );
    invite.isActive = true;
    //invite.organization =

    console.log(invite);

    res.status(418);
    return res.send(invite);
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

import * as express from "express";
const { validationResult, body } = require("express-validator");
import { Invitation } from "./../entity/Invitation";
import { Organization } from "./../entity/Organization";
import { AppUtil } from "./../util/AppUtil";
const mailgun = require("mailgun-js");
import { getManager } from "typeorm";
const jwtDecode = require("jwt-decode");

export default class InvitationsController {
  public static async create(req: express.Request, res: express.Response) {
    const createdBy = "";
    const toEmail = req.body.email;
    const createdDate = new Date();

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    const orgID = req.query.org_id;
    console.log("orgid", orgID);
    const token: string = req.headers["authorization"];
    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    console.log("userId", userId);
    console.log("orgid", orgID);

    // prettier-ignore
    let organization = await getManager().createQueryBuilder()
    .select('org.id')
    .from(Organization, 'org')
    .where('org.uuid = :orgID', { orgID: orgID })
    .getOne()
    const entityManager = getManager(); // you can also get it via getConnection().manager

    const invite = new Invitation();
    invite.email = req.body.email;
    invite.createdDate = new Date();
    invite.expiration = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
    invite.isActive = true;

    const tokenLengths = [32, 33, 34, 35, 36];
    const tokenLength = tokenLengths[Math.floor(Math.random() * tokenLengths.length)];
    invite.token = AppUtil.makeRandomStr(tokenLength);
    invite.organization = organization;

    await entityManager.save(invite);

    const DOMAIN = process.env.MAILGUN_DOMAIN_NAME;
    const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
    const data = {
      from: "Excited User <me@samples.mailgun.org>",
      to: toEmail,
      subject: "You've been invited to join " + process.env.APP_NAME,
      text: "Testing some Mailgun awesomness!",
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });

    res.status(418);
    return res.send(invite);
  }

  public static validate(method: String) {
    switch (method) {
      case "create": {
        return [body("email", "Invalid email").exists().isEmail()];
      }
    }
  }
}

import * as express from "express";
const { validationResult, body } = require("express-validator");
import { Invitation } from "./../entity/Invitation";
import { Organization } from "./../entity/Organization";
import { AppUtil } from "./../util/AppUtil";
const mailgun = require("mailgun-js");
import { getManager, getRepository } from "typeorm";
const jwtDecode = require("jwt-decode");

export default class InvitationsController {
  public static async fetch(req: express.Request, res: express.Response) {
    const sentToken = req.params.token;

    // prettier-ignore
    const foundInvitation = await getRepository(Invitation)
    .createQueryBuilder("invitation")
    .leftJoinAndSelect("invitation.organization", "org")
    .where("invitation.token = :sentToken", { sentToken: sentToken })
    .printSql()
    .getOne();
    console.log(foundInvitation);

    if (foundInvitation == undefined || foundInvitation.isActive === false) {
      res.status(404).send();
      return;
    }

    delete foundInvitation.id;
    delete foundInvitation.updatedDate;
    delete foundInvitation.organization.id;
    delete foundInvitation.organization.createdDate;
    delete foundInvitation.organization.isActive;
    delete foundInvitation.organization.updatedDate;

    return res.status(200).json(foundInvitation);
  }

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
    const inviteToken = AppUtil.makeRandomStr(tokenLength);
    invite.token = inviteToken;
    invite.organization = organization;

    await entityManager.save(invite);

    const DOMAIN = process.env.MAILGUN_DOMAIN_NAME;
    const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
    const data = {
      from: "Excited User <me@samples.mailgun.org>",
      to: toEmail,
      subject: "You've been invited to join " + process.env.APP_NAME,
      text: "Testing some Mailgun awesomness! <br><br> Click on this link to sign up." + process.env.SERVER_URL + "/invite?t=" + inviteToken,
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });

    res.status(200);
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

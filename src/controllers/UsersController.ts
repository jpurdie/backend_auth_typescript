import * as express from "express";
const { validationResult, body } = require("express-validator");
import { getManager, getRepository, Repository } from "typeorm";
import { Invitation } from "./../entity/Invitation";
import { OrganizationUser } from "./../entity/OrganizationUser";
import { Organization } from "./../entity/Organization";
import { Role } from "./../entity/Role";
import { User } from "./../entity/User";
import { ErrorResponse } from "./../entity/ErrorResponse";
import { AuthUtil as authUtility } from "./../util/AuthUtil";

export default class PingController {
  public static async create(req: express.Request, res: express.Response, next) {
    const sentToken = req.body.urlToken;
    console.log(req.body);

    // prettier-ignore
    const foundInvitation = await getRepository(Invitation).
    createQueryBuilder("invitation").
    leftJoinAndSelect("invitation.organization", "org")
    .where("invitation.token = :sentToken", { sentToken: sentToken })
    .getOne();

    // Begin Error Handling
    if (foundInvitation == undefined) {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.message = "Token not found";
      res.status(400).send();
      return;
    }

    if (foundInvitation.isActive === false || foundInvitation.expiration < new Date()) {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.message = "Token is no longer valid";
      res.status(400).send();
      return;
    }

    //End Error Handling

    const userToSave = new User();
    userToSave.email = foundInvitation.email;
    userToSave.firstName = req.body.firstName;
    userToSave.lastName = req.body.lastName;
    userToSave.password = req.body.password;

    const orgUserToSave = new OrganizationUser();
    orgUserToSave.organization = foundInvitation.organization;

    // TODO: Convert this to querybuilder
    const rlRepository: Repository<Role> = getManager().getRepository(Role);

    //default "user" role
    const existingRL = await rlRepository.find({
      where: { role: "user" },
    });

    orgUserToSave.role = existingRL[0];

    // Creates user in Auth0
    const externalID = await authUtility.createUser(userToSave);
    if (externalID == undefined || externalID == "") {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.message = "Unable to create user. Please try again.";
      res.status(400).send();
      return;
    }

    // user was created in Auth0
    userToSave.externalId = externalID;
    orgUserToSave.user = userToSave;

    try {
      // Creates user and orguser in database
      const savedOrgUserRepo = await getManager().save(orgUserToSave);

      if (savedOrgUserRepo) {
        authUtility.sendVerificationEmail(userToSave);

        //TODO: Mark invitation as used

        res.status(201).send();
        return;
      }
    } catch (err) {
      // TODO: Handle error in api response
      console.log(err);
    }

    res.status(422).send();
  }

  public static validate(method: String) {
    switch (method) {
      case "create": {
        return [body("email", "Invalid email").exists().isEmail()];
      }
    }
  }
}

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
import { AppUtil } from "./../util/AppUtil";

export default class UsersController {
  public static async create(req: express.Request, res: express.Response, next) {
    const sentToken = req.body.urlToken;

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
      res.status(400).json([myError]);
      return;
    }

    if (foundInvitation.isActive === false || foundInvitation.expiration < new Date()) {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.message = "Token is no longer valid";
      res.status(400).json([myError]);
      return;
    }
    await AppUtil.sleep(2000); //sleep for 5 seconds

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

    // default "user" role
    // prettier-ignore
    const existingRL = await getRepository(Role).
    createQueryBuilder("role")
    .where("role.name = :role", { role: "user" })
    .getOne();

    orgUserToSave.role = existingRL;

    // Creates user in Auth0

    const auth0Response = await authUtility.createUser(userToSave);
    console.log("auth0Response", auth0Response);

    if (auth0Response === undefined) {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.message = "Unable to create user. Please try again.";
      res.status(400).json([myError]);
      return;
    }

    // user was created in Auth0
    userToSave.externalId = auth0Response.user_id;
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

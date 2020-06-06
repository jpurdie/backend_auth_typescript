import * as express from "express";
import { validate, ValidationError, Validator } from "class-validator";
import { getManager, Repository, getRepository } from "typeorm";
const { validationResult, body } = require("express-validator");
import { AuthUtil as authUtility, AuthUtil } from "./../util/AuthUtil";
import { AppUtil } from "./../util/AppUtil";
import { User } from "./../entity/User";
import { Organization } from "./../entity/Organization";
import { OrganizationUser } from "./../entity/OrganizationUser";
import { Role } from "./../entity/Role";
const jwtDecode = require("jwt-decode");
import { ErrorResponse } from "./../entity/ErrorResponse";

export default class OrgsController {
  public static async fetchAllAccessable(req: express.Request, res: express.Response, next) {
    const token: string = req.headers["authorization"];
    const decoded = jwtDecode(token);
    const userId = decoded.sub;

    const entityManager = getManager();

    // prettier-ignore
    const foundOrgs = await getRepository(Organization)
    .createQueryBuilder("organization")
    .innerJoin(OrganizationUser, "orgUser", "orgUser.organization_id = organization.id")
    .innerJoin(User, "user", "user.id= orgUser.user_id")
    .where("user.externalId = :userId", { userId: userId })
    .getMany();

    for (var i = 0; i < foundOrgs.length; i++) {
      delete foundOrgs[i].id;
      delete foundOrgs[i].createdDate;
      delete foundOrgs[i].isActive;
      delete foundOrgs[i].updatedDate;
    }

    return res.json(foundOrgs).status(200);
  }

  public static async register(req: express.Request, res: express.Response, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      let myErrors = [];
      for (let i = 0; i < errors.errors.length; i++) {
        let myError = new ErrorResponse();
        myError.code = "400";
        myError.msg = errors.errors[i].msg;
        myErrors.push(myError);
      }
      return res.status(422).json({ errors: myErrors });
    }
    const entityManager = getManager();
    const rlRepository: Repository<Role> = getManager().getRepository(Role);

    const userToSave = new User();
    userToSave.email = req.body.email;
    userToSave.firstName = req.body.firstName;
    userToSave.lastName = req.body.lastName;
    userToSave.password = req.body.password;

    const orgToBeSaved = new Organization();
    orgToBeSaved.name = req.body.orgName;
    orgToBeSaved.isActive = true;
    orgToBeSaved.createdDate = new Date();
    orgToBeSaved.updatedDate = new Date();

    const orgUserToSave = new OrganizationUser();
    orgUserToSave.organization = orgToBeSaved;

    const existingRL = await rlRepository.find({
      where: { role: "owner" },
    });

    orgUserToSave.role = existingRL[0];

    // Creates user in Auth0
    const auth0Response = await authUtility.createUser(userToSave);

    if (auth0Response.error !== null && auth0Response.error !== undefined) {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.msg = auth0Response.message;
      return res.status(422).json({ errors: [myError] });
    }

    console.log("auth0Response.user_id", auth0Response.user_id);

    // user was created in Auth0
    userToSave.externalId = auth0Response.user_id;
    orgUserToSave.user = userToSave;

    try {
      // Creates user, org, and orguser in database
      const savedOrgUserRepo = await entityManager.save(orgUserToSave);
      orgToBeSaved.uuid = savedOrgUserRepo.uuid;
      console.log("savedOrgUserRepo: ", savedOrgUserRepo);

      if (savedOrgUserRepo) {
        authUtility.sendVerificationEmail(userToSave);
        res.status(201).send();
        return;
      }
    } catch (err) {
      //there was an error creating the user in the database. Need to delete the user from Auth0.
      if (userToSave.externalId !== null && userToSave.externalId !== undefined) {
        await AuthUtil.deleteUser(userToSave);
      }
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.msg = "Unable to create user. Please try again";
      return res.status(422).json({ errors: [myError] });
    }

    let myError = new ErrorResponse();
    myError.code = "400";
    myError.msg = "Unable to create user. Please try again";
    return res.status(422).json({ errors: [myError] });
  }

  public static validate(method: String) {
    switch (method) {
      case "register": {
        return [
          body("orgName", "Organization name must be between 4 and 80 characters").trim().isLength({
            min: 4,
            max: 80,
          }),
          body("firstName", "First name missing").trim().isLength({
            min: 2,
            max: 80, //
          }),
          body("lastName", "Last name missing").trim().isLength({
            min: 2,
            max: 80,
          }),
          body("email", "Invalid email").exists().isEmail(),
          body("password", "Password is not valid").custom((pass, { req }) => {
            if (AppUtil.isNullOrEmptyOrUnd(pass)) {
              throw new Error("Password is not valid");
            }

            const pattern = /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{10,64}$/;
            if (!pattern.test(pass)) {
              throw new Error("Password is not valid");
            } else {
              return true;
            }
          }),
          body("passwordConfirm").custom((passConfirm, { req }) => {
            const pass = req.body.password;
            if (AppUtil.isNullOrEmptyOrUnd(passConfirm) || passConfirm.trim() !== pass) {
              throw new Error("Password confirmation does not match password");
            } else {
              return true;
            }
          }),
        ];
      }
    }
  }
}

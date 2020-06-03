import * as express from "express";
import { validate, ValidationError, Validator } from "class-validator";
import { getManager, Repository, getRepository } from "typeorm";
const { validationResult, body } = require("express-validator");
import { AuthUtil as authUtility } from "./../util/AuthUtil";
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
    await AppUtil.sleep(3000);
    res.status(418).json([]);
    return;

    // Creates user in Auth0
    const auth0Response = await authUtility.createUser(userToSave);
    console.log("auth0Response", auth0Response);
    console.log("auth0Response.error", typeof auth0Response.error);

    if (auth0Response.error !== undefined) {
      let myError = new ErrorResponse();
      myError.code = "400";
      myError.msg = "Unable to register. Please try again.";
      res.status(400).json([myError]);
      return;
    }
    console.log("auth0Response.user_id", auth0Response.user_id);

    // user was created in Auth0
    userToSave.externalId = auth0Response.user_id;
    orgUserToSave.user = userToSave;

    try {
      // Creates user, org, and orguser in database
      // const savedOrgUserRepo = await orgUserRepository.save(orgUserToSave);
      const savedOrgUserRepo = await entityManager.save(orgUserToSave);
      orgToBeSaved.uuid = savedOrgUserRepo.uuid;
      console.log("savedOrgUserRepo: ", savedOrgUserRepo);

      if (savedOrgUserRepo) {
        // Creates permission in Auth0
        //  const role = await authUtility.createRole(orgToBeSaved);
        //  const perm = await authUtility.createPermission(orgToBeSaved);
        //  const y = await authUtility.associatePermissionsWithRole(role, perm);
        // const z = await authUtility.assignRoleToUser(orgUserToSave.user, role);
      }
      // res.status(418).send();
      if (savedOrgUserRepo) {
        authUtility.sendVerificationEmail(userToSave);
        res.status(201).send();
        return;
      }
    } catch (err) {
      console.log(err);
    }

    res.status(422).send();
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
            min: 4,
            max: 80,
          }),
          body("lastName", "Last name missing").trim().isLength({
            min: 4,
            max: 80,
          }),
          body("email", "Invalid email").exists().isEmail(),
          body("password", "Password is not valid").trim().isLength({
            min: 10,
            max: 80,
          }),
          body("passwordConfirm").custom((value, { req }) => {
            if (value !== req.body.password) {
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

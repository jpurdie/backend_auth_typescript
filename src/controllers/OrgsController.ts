import * as express from "express";
import { validate, ValidationError, Validator } from "class-validator";
import { getManager, Repository } from "typeorm";
const { validationResult, body } = require("express-validator");
import { AuthUtil as authUtility } from "./../util/AuthUtil";
import { User } from "./../entity/User";
import { Organization } from "./../entity/Organization";
import { OrganizationUser } from "./../entity/OrganizationUser";
import { Role } from "./../entity/Role";

export default class OrgsController {
  public static async register(req: express.Request, res: express.Response, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }
    const entityManager = getManager();
    const rlRepository: Repository<Role> = getManager().getRepository(Role);

    let userToSave = new User();
    userToSave.email = req.body.email;
    userToSave.firstName = req.body.firstName;
    userToSave.lastName = req.body.lastName;
    userToSave.password = req.body.password;

    let orgToBeSaved = new Organization();
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
    const externalID = await authUtility.createUser(userToSave);
    if (externalID == null || externalID == "") {
      res.status(422).send();
      return;
    }

    //user was created in Auth0
    userToSave.externalId = externalID;
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

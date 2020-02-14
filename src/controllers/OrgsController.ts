import * as express from 'express'
import {
  validate,
  ValidationError,
  Validator
} from 'class-validator'
import {
  getManager,
  Repository
} from 'typeorm'
const {
  validationResult,
  body
} = require('express-validator');
import {
  AuthUtil as authUtility
} from './../util/AuthUtil';
import {
  User
} from './../entity/User'
import {
  Organization
} from './../entity/Organization'
import {
  OrganizationUser
} from './../entity/OrganizationUser'

export default class OrgsController {

  public static async register(req: express.Request, res: express.Response, next) {


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array()
      });
    }

    let userToSave = new User
    userToSave.email = req.body.email
    userToSave.firstName = req.body.firstName
    userToSave.lastName = req.body.lastName
    userToSave.password = req.body.password
    

    let orgToBeSaved = new Organization
    orgToBeSaved.name = req.body.orgName;
    orgToBeSaved.isActive = true;
    orgToBeSaved.createdDate = new Date();
    orgToBeSaved.updatedDate = new Date();

   //  const orgRepository: Repository < Organization > = getManager().getRepository(Organization)
   // const userRepository: Repository<User> = getManager().getRepository(User)
    const orgUserRepository: Repository<OrganizationUser> = getManager().getRepository(OrganizationUser)
    
    const orgUserToSave = new OrganizationUser()
    orgUserToSave.organization = orgToBeSaved
    
    //need to save user
    const userID = await authUtility.createUser(userToSave)
    userToSave.externalId = userID
    orgUserToSave.user = userToSave
    try{
      const savedOrgUserRepo = await orgUserRepository.save(orgUserToSave)

      console.log('savedOrgUserRepo');
      console.log(savedOrgUserRepo);
      if(savedOrgUserRepo){
        res.status(201).send()
        return
      }
    }catch(err) {
        console.log(err)
    }

    res.status(422).send()
  }

  public static validate(method: String) {
    switch (method) {
      case 'register':
        {
          return [
            body('orgName', 'Organization name must be between 4 and 80 characters').trim().isLength({
              min: 4,
              max: 80
            }),
            body('firstName', 'First name missing').trim().isLength({
              min: 4,
              max: 80
            }),
            body('lastName', 'Last name missing').trim().isLength({
              min: 4,
              max: 80
            }),
            body('email', 'Invalid email').exists().isEmail(),
            body('password', 'Password is not valid').trim().isLength({
              min: 10,
              max: 80
            }),
            body('passwordConfirm').custom((value, {
              req
            }) => {
              if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
              } else {
                return true;
              }
            }),
          ]
        }
    }
  }

}
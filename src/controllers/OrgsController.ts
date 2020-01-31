import * as express from 'express'
import {
  validate,
  ValidationError,
  Validator
} from 'class-validator'

const { validationResult, body } = require('express-validator');
import { AuthUtil as authUtility } from './../util/AuthUtil';
import { User } from './../entity/User'
import { Organization } from './../entity/Organization'

export default class OrgsController {

  public static async register(req: express.Request, res: express.Response, next) {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array()
      });
    }
    
    let user = new User
    user.email = req.body.email
    user.firstName = req.body.firstName
    user.lastName = req.body.lastName
    
    let orgToBeSaved = new Organization
    orgToBeSaved.name = req.body.orgName;
    orgToBeSaved.isActive = true;
    orgToBeSaved.createdDate = new Date();
    orgToBeSaved.updatedDate = new Date();
    
    
    const accessToken = await authUtility.fetchAccessToken();

    var options2 = {
      method: 'POST',
      url: 'https://' + process.env.AUTH0_DOMAIN + '/api/v2/users',
      headers: {
        authorization: 'Bearer ' + accessToken
      },
      json: {
        "email": user.email,
        "user_metadata": {},
        "blocked": false,
        "email_verified": false,
        "app_metadata": {},
        "given_name": user.firstName,
        "family_name": user.lastName,
        "name": user.firstName + user.lastName,
        "nickname": user.firstName,
        "connection": "PPM",
        "password": req.body.password,
        "verify_email": false
      }
    };    
    
    console.log(options2)


    res.status(418)
    res.send('register')
  }

  public static validate(method: String) {
    switch (method) {
      case 'register':
        {
          return [
            body('orgName', 'Organization name must be between 4 and 80 characters').trim().isLength({min:4, max: 80}),
            body('firstName', 'First name missing').trim().isLength({min:4, max: 80}),
            body('lastName', 'Last name missing').trim().isLength({min:4, max: 80}),
            body('email', 'Invalid email').exists().isEmail(),
            body('password', 'Password is not valid').trim().isLength({min:10, max: 80}),
            body('passwordConfirm').custom((value, { req }) => {
              if(value !== req.body.password){
                throw new Error('Password confirmation does not match password');
              }else{
                return true;
              }
            }),
          ]
        }
    }
  }

}
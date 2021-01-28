import * as express from 'express'
const { validationResult, body } = require('express-validator')

export default class UsersController {
  public static async create (
    req: express.Request,
    res: express.Response,
    next
  ) {
    res.status(418).send()
  }

  public static validate (method: String) {
    switch (method) {
      case 'create': {
        return [
          body('email', 'Invalid email').exists().isEmail(),
          body('firstName', 'First name missing').trim().isLength({
            min: 4,
            max: 80
          })
        ]
      }
    }
  }
}

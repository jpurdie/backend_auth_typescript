import * as express from 'express'

export default class PingController {
  
  public static async ping(req: express.Request, res: express.Response, next) {
    const foo = "bar"
    res.status(200)
    res.send('pong')
  }
  
}
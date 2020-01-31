const axios = require("axios");
import * as dotenv from 'dotenv'
var Redis = require("ioredis");
var redis = new Redis();

export class AuthUtil {


  public static async fetchAccessToken(): Promise < String > {
    console.log("auth0Authenticate");
    const key = 'auth0_access_token';

    const accessToken = await redis.get(key)

    if (accessToken === null) {
      console.log("Access Token is null. Going out to Auth0 " + process.env.AUTH0_CLIENT_ID)
      var AuthenticationClient = require('auth0').AuthenticationClient;

      const requestBody = {
        "client_id": process.env.AUTH0_CLIENT_ID,
        "client_secret": process.env.AUTH0_CLIENT_SECRET,
        "audience": 'https://' + process.env.AUTH0_DOMAIN + '/api/v2/',
        "grant_type": "client_credentials"
      }

      const resp = await axios({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        url: 'https://' + process.env.AUTH0_DOMAIN + '/oauth/token',
        data: JSON.stringify(requestBody)
      });
      redis.set("auth0_access_token", resp.data.access_token, 'EX', 3600); // expire in 1 hour
      return resp.data.access_token;
    } else {
      console.log("Access Token is present. Not reaching to Auth 0.")
      return accessToken
    }

  }



}
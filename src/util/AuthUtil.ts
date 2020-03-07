const axios = require("axios");
import * as dotenv from "dotenv";
var Redis = require("ioredis");
var redis = new Redis({
  port: process.env.REDIS_PORT, // Redis port
  host: process.env.REDIS_HOST, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: process.env.REDIS_PW,
  db: 0
});
import { User } from "./../entity/User";

export class AuthUtil {
  public static async fetchAccessToken(): Promise<String> {
    console.log("auth0Authenticate");
    const key = "auth0_access_token";

    const accessToken = await redis.get(key);

    if (accessToken === null) {
      console.log(
        "Access Token is null. Going out to Auth0 " +
          process.env.AUTH0_CLIENT_ID
      );
      var AuthenticationClient = require("auth0").AuthenticationClient;

      const requestBody = {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_DOMAIN + "api/v2/",
        grant_type: "client_credentials"
      };
      console.log(
        "Sending request to auth0 " + process.env.AUTH0_DOMAIN + "api/v2/"
      );
      const resp = await axios({
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        url: process.env.AUTH0_DOMAIN + "oauth/token",
        data: JSON.stringify(requestBody)
      });
      console.log("Received response from auth0");
      redis.set("auth0_access_token", resp.data.access_token, "EX", 3600); // expire in 1 hour
      return resp.data.access_token;
    } else {
      console.log(
        "Access Token exists in redis. Not reaching to Auth 0 for token."
      );
      return accessToken;
    }
  }

  public static async sendVerificationEmail(user: User): Promise<string> {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/jobs/verification-email",
      headers: {
        authorization: "Bearer " + accessToken
      },
      data: {
        client_id: process.env.AUTH0_CLIENT_ID,
        user_id: user.externalId
      }
    };
    console.log(postRequest.url);
    try {
      const resp = await axios(postRequest);
      console.log(resp.data);
      if (resp.status === 201) {
        return resp.data.user_id;
      }
    } catch (error) {
      console.log(error.data);
    }

    return null;
  }

  // public static async sendInvitationEmail(user: User): Promise<string> {
  //   // const message = {
  //   //   from: "elonmusk@tesla.com",
  //   //   to: "to@email.com",
  //   //   subject: "Design Your Model S | Tesla",
  //   //   html:
  //   //     "<h1>Have the most fun you can in a car!</h1><p>Get your <b>Tesla</b> today!</p>"
  //   // };
  // }

  public static async createUser(user: User): Promise<string> {
    const accessToken = await AuthUtil.fetchAccessToken();
    console.log("accessToken " + accessToken.length);
    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/users",
      headers: {
        authorization: "Bearer " + accessToken
      },
      data: {
        email: user.email,
        user_metadata: {},
        blocked: false,
        email_verified: false,
        app_metadata: { tenant: "org_12345" },
        given_name: user.firstName,
        family_name: user.lastName,
        name: user.firstName + user.lastName,
        nickname: user.firstName,
        connection: "PPM",
        password: user.password,
        verify_email: false
      }
    };

    console.log("Sending request to " + postRequest.url);
    try {
      const resp = await axios(postRequest);
      console.log("Response from user creation " + resp.status);
      if (resp.status === 201) {
        return resp.data.user_id;
      }
    } catch (error) {
      console.log("error.response.status");
      console.log(error.response.status);
    }

    return null;
  }
}

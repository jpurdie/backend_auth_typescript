const axios = require("axios");
import * as dotenv from "dotenv";
const Redis = require("ioredis");
const redis = new Redis({
  port: process.env.REDIS_PORT, // Redis port
  host: process.env.REDIS_HOST, // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: process.env.REDIS_PW,
  db: 0,
});
import { getManager, Repository } from "typeorm";
import { User } from "./../entity/User";
// import { Permission } from "./../entity/Permission";

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
      const AuthenticationClient = require("auth0").AuthenticationClient;

      const requestBody = {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_DOMAIN + "api/v2/",
        grant_type: "client_credentials",
      };
      console.log(
        "Sending request to auth0 " + process.env.AUTH0_DOMAIN + "api/v2/"
      );

      try {
        const resp = await axios({
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          url: process.env.AUTH0_DOMAIN + "oauth/token",
          data: JSON.stringify(requestBody),
        });

        redis.set("auth0_access_token", resp.data.access_token, "EX", 30); // time in seconds
        return resp.data.access_token;
      } catch (error) {
        /*
         * The request was made and the server responded with a
         * status code that falls out of the range of 2xx
         */
        console.log(error.response.data);
      }
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
        authorization: "Bearer " + accessToken,
      },
      data: {
        client_id: process.env.AUTH0_CLIENT_ID,
        user_id: user.externalId,
      },
    };

    console.log(
      "Sending + " +
        postRequest.method +
        " request to " +
        postRequest.url +
        " " +
        JSON.stringify(postRequest.data)
    );

    try {
      const resp = await axios(postRequest);
      console.log(resp.data);
      if (resp.status === 201) {
        return resp.data;
      }
    } catch (error) {
      console.log(error.data);
    }

    return undefined;
  }

  public static async getResourceServers() {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "GET",
      url: process.env.AUTH0_DOMAIN + "api/v2/resource-servers",
      headers: {
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache",
      },
    };

    console.log(
      "Sending + " +
        postRequest.method +
        " request to " +
        JSON.stringify(postRequest.url)
    );
    try {
      const resp = await axios(postRequest);
      console.log(
        "Response from perm creation " + resp.status + " " + resp.data
      );
      if (resp.status === 201) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response");
      console.log(error.response);
    }

    return undefined;
  }

  public static async createUser(user: User): Promise<any> {
    const accessToken = await AuthUtil.fetchAccessToken();
    console.log("accessToken.length", accessToken.length);
    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/users",
      headers: {
        authorization: "Bearer " + accessToken,
      },
      data: {
        email: user.email,
        user_metadata: {},
        blocked: false,
        email_verified: false,
        app_metadata: {},
        given_name: user.firstName,
        family_name: user.lastName,
        name: user.firstName + user.lastName,
        nickname: user.firstName,
        connection: "VitaeDB",
        password: user.password,
        verify_email: false,
      },
    };

    console.log(
      "Sending + " + postRequest.method + " request to " + postRequest.url
    );

    try {
      const resp = await axios(postRequest);
      console.log("Response from user creation " + resp.status);
      return resp.data;
    } catch (error) {
      console.error("Problem creating Auth0 user", error.response.data);
      return error.response.data;
    }
  }

  public static async deleteUser(user: User): Promise<any> {
    const accessToken = await AuthUtil.fetchAccessToken();
    const postRequest = {
      method: "DELETE",
      url: process.env.AUTH0_DOMAIN + "api/v2/users/" + user.externalId,
      headers: {
        authorization: "Bearer " + accessToken,
      },
    };

    console.log(
      "Sending + " + postRequest.method + " request to " + postRequest.url
    );

    try {
      const resp = await axios(postRequest);
      console.log("Response from user deletion " + resp.status);
      return resp.data;
    } catch (error) {
      console.error("Problem deleting Auth0 user", error.response.data);
      return error.response.data;
    }
  }
}

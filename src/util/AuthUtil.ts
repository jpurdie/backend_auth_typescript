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
import { Organization } from "src/entity/Organization";

export class AuthUtil {
  public static async fetchAccessToken(): Promise<String> {
    console.log("auth0Authenticate");
    const key = "auth0_access_token";

    const accessToken = await redis.get(key);

    if (accessToken === null) {
      console.log("Access Token is null. Going out to Auth0 " + process.env.AUTH0_CLIENT_ID);
      var AuthenticationClient = require("auth0").AuthenticationClient;

      const requestBody = {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_DOMAIN + "api/v2/",
        grant_type: "client_credentials"
      };
      console.log("Sending request to auth0 " + process.env.AUTH0_DOMAIN + "api/v2/");
      const resp = await axios({
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        url: process.env.AUTH0_DOMAIN + "oauth/token",
        data: JSON.stringify(requestBody)
      });
      console.log("Received response from auth0");
      redis.set("auth0_access_token", resp.data.access_token, "EX", 30); // time in seconds
      return resp.data.access_token;
    } else {
      console.log("Access Token exists in redis. Not reaching to Auth 0 for token.");
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

  public static async createRole(org: Organization) {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/roles",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      },
      data: {
        name: org.name.replace(/[^A-Za-z0-9]/g, "") + "|" + org.uuid,
        description: org.name
      }
    };

    console.log("Sending request to " + postRequest.url);
    try {
      const resp = await axios(postRequest);
      console.log("Response from role creation " + resp.status);
      if (resp.status === 201) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response");
      console.log(error.response.status + " " + error.response.message);
    }

    return null;
  }

  public static async getResourceServers() {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "GET",
      url: process.env.AUTH0_DOMAIN + "api/v2/resource-servers",
      headers: {
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      }
    };

    console.log("Sending request to " + postRequest.url);
    try {
      const resp = await axios(postRequest);
      console.log("Response from perm creation " + resp.status);
      if (resp.status === 201) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response");
      console.log(error.response);
    }

    return null;
  }

  public static async createPermission(org: Organization) {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "PATCH",
      url: process.env.AUTH0_DOMAIN + "api/v2/resource-servers/5e62d0b0ab37e809294d5cce",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      },
      data: {
        scopes: [{ value: org.uuid, description: org.name }]
      }
    };

    console.log("Sending request to " + postRequest.url);
    try {
      const resp = await axios(postRequest);
      console.log("Response from perm creation " + resp.status);
      if (resp.status === 201) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response");
      console.log(error.response);
    }

    return null;
  }

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
        app_metadata: {},
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

  public static async associatePermissionsWithRole(roleID: String, permissionId: String) {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/roles/" + roleID + "/permissions",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      },
      data: {
        permissions: ["object"]
      }
    };

    console.log("Sending request to " + postRequest.url);
    try {
      const resp = await axios(postRequest);
      console.log("Response from perm creation " + resp.status);
      if (resp.status === 201) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response");
      console.log(error.response);
    }

    return null;
  }
}

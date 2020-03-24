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
import { getManager, Repository } from "typeorm";
import { User } from "./../entity/User";
import { Role } from "./../entity/Role";
import { Permission } from "./../entity/Permission";
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
      console.log("Received response from auth0 " + resp.data.access_token);
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

    console.log("Sending + " + postRequest.method + " request to " + postRequest.url + " " + JSON.stringify(postRequest.data));

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

    console.log("Sending + " + postRequest.method + " request to " + JSON.stringify(postRequest.url));
    try {
      const resp = await axios(postRequest);
      console.log("Responded with", resp.data);
      if (resp.status === 200) {
        let role = new Role();
        const roleRepository: Repository<Role> = getManager().getRepository(Role);
        role.externalId = resp.data.id;
        role.name = resp.data.name;
        role.description = resp.data.description;
        role.isActive = true;
        console.log("Pre-insert", role);
        const roleSaved = await roleRepository.save(role);
        console.log("Post-insert", roleSaved);
        //role created successfully
        return role;
      }
    } catch (error) {
      console.log("error");
      console.log(error);
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

    console.log("Sending + " + postRequest.method + " request to " + JSON.stringify(postRequest.url));
    try {
      const resp = await axios(postRequest);
      console.log("Response from perm creation " + resp.status + " " + resp.data);
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
      url: process.env.AUTH0_DOMAIN + "api/v2/resource-servers/" + process.env.AUTH0_RESOURCESERVER_ID,
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      },
      data: {
        scopes: [{ value: org.name.replace(/[^A-Za-z0-9]/g, "") + "|" + org.uuid, description: org.name }]
      }
    };

    console.log("Sending + " + postRequest.method + " request to " + postRequest.url + " " + JSON.stringify(postRequest.data));

    try {
      const resp = await axios(postRequest);
      console.log("Response from perm creation " + resp.status);
      if (resp.status === 200) {
        console.log("Responded with", resp.data);
        let permission = new Permission();
        const permRepository: Repository<Permission> = getManager().getRepository(Permission);
        //  permission.externalId = resp.data.id;
        permission.name = org.name.replace(/[^A-Za-z0-9]/g, "") + "|" + org.uuid;
        permission.description = org.name;
        permission.isActive = true;
        console.log("Pre-Insert", permission);
        const permSaved = await permRepository.save(permission);
        console.log("Post-Insert", permSaved);

        return permission;
      }
    } catch (error) {
      console.log("error");
      console.log(error);
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

    console.log("Sending + " + postRequest.method + " request to " + postRequest.url + " " + JSON.stringify(postRequest.data));

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

  public static async assignRoleToUser(user: User, role: Role) {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/users/" + user.externalId + "/roles",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      },
      data: {
        roles: [role.externalId]
      }
    };
    //[ , { "resource_server_identifier": "API_IDENTIFIER", "permission_name": "PERMISSION_NAME" } ] }
    console.log("Sending + " + postRequest.method + " request to " + postRequest.url + " " + JSON.stringify(postRequest.data));

    try {
      const resp = await axios(postRequest);
      console.log("Response from assignRoleToUser", resp.data);
      if (resp.status >= 200 && resp.status <= 299) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response.data");
      console.log(error.response.data);
    }

    return null;
  }

  public static async associatePermissionsWithRole(role: Role, permission: Permission) {
    const accessToken = await AuthUtil.fetchAccessToken();

    const postRequest = {
      method: "POST",
      url: process.env.AUTH0_DOMAIN + "api/v2/roles/" + role.externalId + "/permissions",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + accessToken,
        "cache-control": "no-cache"
      },
      data: {
        permissions: [{ resource_server_identifier: process.env.AUTH0_AUDIENCE, permission_name: permission.name }]
      }
    };
    //[ , { "resource_server_identifier": "API_IDENTIFIER", "permission_name": "PERMISSION_NAME" } ] }
    console.log("Sending + " + postRequest.method + " request to " + postRequest.url + " " + JSON.stringify(postRequest.data));

    try {
      const resp = await axios(postRequest);
      console.log("Response from perm creation", resp.data);
      if (resp.status >= 200 && resp.status <= 299) {
        return resp.data;
      }
    } catch (error) {
      console.log("error.response.data");
      console.log(error.response.data);
    }

    return null;
  }
}

const express = require("express");
const router = express.Router();
import { default as PingController } from "../controllers/PingController";
import { default as OrgsController } from "../controllers/OrgsController";
import { default as UsersController } from "../controllers/UsersController";
import { default as InvitationsController } from "../controllers/InvitationsController";
const authz = require("../middlewares/Authz");

const jwt = require("express-jwt");
const jwtAuthz = require("express-jwt-authz");
const jwksRsa = require("jwks-rsa");

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.AUTH0_DOMAIN + ".well-known/jwks.json",
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_DOMAIN,
  algorithms: ["RS256"],
});

// ping controller
router.get("/ping", [authz(["owner", "admin", "user"]), checkJwt], PingController.ping);

// auth organizations controllers
router.post("/v1/organizations", OrgsController.validate("register"), OrgsController.register);
router.get("/v1/organizations", [checkJwt], OrgsController.fetchAllAccessable);

// users
router.post("/v1/users", UsersController.validate("create"), UsersController.create);

//invitations
router.post("/v1/invitations", InvitationsController.validate("create"), checkJwt, InvitationsController.create);
router.get("/v1/invitations/:token", InvitationsController.fetch);

module.exports = router;

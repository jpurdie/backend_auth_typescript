const express = require("express");
const router = express.Router();
import { default as PingController } from "../controllers/PingController";
import { default as UsersController } from "../controllers/UsersController";
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
router.get(
  "/ping",
  [authz(["owner", "admin", "user"]), checkJwt],
  PingController.ping
);
// users
router.post(
  "/v1/users",
  UsersController.validate("create"),
  UsersController.create
);

module.exports = router;

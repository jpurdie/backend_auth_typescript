const express = require('express')
const router = express.Router()
import  { default as PingController } from '../controllers/PingController'
import  { default as OrgsController } from '../controllers/OrgsController'

router.get('/ping', PingController.ping)

// auth controllers

router.post('/v1/organizations', OrgsController.validate('register'),  OrgsController.register)

module.exports = router
  
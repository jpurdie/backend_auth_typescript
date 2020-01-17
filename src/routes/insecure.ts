const express = require('express')
const router = express.Router()
import  { default as PingController } from '../controllers/ping-controller'

router.get('/ping', PingController.ping)

module.exports = router
  
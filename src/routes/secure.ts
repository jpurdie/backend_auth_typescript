import PingController from '../controllers/PingController'

const express = require('express')
const router = express.Router()

// ping controller
router.get(
  '/ping',
  PingController.ping
)

export default router

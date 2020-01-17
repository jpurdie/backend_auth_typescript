const serverless = require('serverless-http');
const express = require( 'express' )

const bodyParser = require('body-parser')
import * as winston from 'winston'
import * as dotenv from 'dotenv'
import { createConnection } from 'typeorm'
const cors = require('cors')
const helmet = require('helmet')
import 'reflect-metadata'
import * as PostgressConnectionStringParser from 'pg-connection-string'


import { logger } from './logging'
import { config } from './config'

import * as defaultInserts  from './util/DefaultInserts'

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: '.env' })

// Get DB connection options from env variable
const connectionOptions = PostgressConnectionStringParser.parse(config.databaseUrl)

const xlogger = function(req, res, next) {
    console.log(req.method + ' ' + req.url)
    next() // Passing the request to the next handler in the stack.
}

// create connection with database
// note that its not active database connection
// TypeORM creates you connection pull to uses connections from pull on your requests
createConnection({
    type: 'postgres',
    host: connectionOptions.host,
    port: 5432,
    username: connectionOptions.user,
    password: connectionOptions.password,
    database: connectionOptions.database,
    synchronize: true,
    logging: false,
    entities: [
      `${__dirname}/entity/**/*.ts`,
    ],
    extra: {
        ssl: config.dbsslconn, // if not development, will use SSL
    }
 }).then(async connection => {
  
   // require('./passport-config')
    const app = express()
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(helmet())
    app.use(xlogger)

    app.use(cors({
      origin: '*'
    }))
  
    app.use('/api/', require('./routes/routes'))

    await defaultInserts.roleLkupInsert()

    // start the Express server
    app.listen( config.port, () => {
      console.log( `server started at http://0.0.0.0:${ config.port }` )
    } )
  
   module.exports = app
   await connection.close();

}).catch(error => console.log('TypeORM connection error: ', error))
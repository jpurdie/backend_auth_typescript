import { Container } from 'typedi'
import expressLoader from './express'
import databaseLoader from './database'
import Logger from '../logger'
import { Application } from 'express'
import { loggers } from 'winston'

export default async (app: Application): Promise<void> => {
  console.log('index 1')
  Container.set('logger', Logger)
  try {
    await databaseLoader()
    console.log('index 4')
  } catch (err) {
    throw err
  }
  Logger.info('Database loaded and connected!')

  expressLoader(app)
  Logger.info('Express loaded!')
}

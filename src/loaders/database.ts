import Logger from '../logger'
import { Connection, createConnection, useContainer } from 'typeorm'
import { Container } from 'typedi'

export default async (): Promise<Connection> => {
  console.log('database 2')
  useContainer(Container)
  try {
    console.log('database 3')

    return await createConnection()
  } catch (err) {
    Logger.debug(err)
    throw err
  }
}

import Logger from "../logger";
import { Connection, createConnection, useContainer } from "typeorm";
import { Container } from "typedi";

export default async (): Promise<Connection> => {
  console.log("2");
  useContainer(Container);
  try {
    return await createConnection();
  } catch (err) {
    Logger.debug(err);
    throw err;
  }
};

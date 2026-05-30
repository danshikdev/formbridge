import { Sequelize } from "sequelize";
import { env } from "./env.js";

const commonOptions = {
  dialect: "postgres",
  logging: false,
  dialectOptions: env.db.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {}
};

export const sequelize = env.db.url
  ? new Sequelize(env.db.url, commonOptions)
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      ...commonOptions,
      host: env.db.host,
      port: env.db.port
    });

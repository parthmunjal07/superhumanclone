import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  // @ts-expect-error - earlyAccess is a valid configuration option in prisma client/config but missing from type definitions
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL,
  },
})

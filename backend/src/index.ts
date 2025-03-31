import { Hono } from 'hono'
import v1 from './routes/api'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

type CustomContext = {
  Variables: {
    prisma: PrismaClient;
  };
};

const app = new Hono<{
  Bindings:{
    DATABASE_URL : string,
    KEY:string
  }
}>()

app.use("*",async function(c,next){
 c.set("prisma", new PrismaClient({
  datasourceUrl : c.env.DATABASE_URL,
 }).$extends(withAccelerate()));

 await next();
})

app.route('/app/v1',v1);



export default app

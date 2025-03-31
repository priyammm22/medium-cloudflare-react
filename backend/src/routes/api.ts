import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client/extension';
import { Hono } from 'hono';
import { decode, sign, verify } from 'hono/jwt';
import {signupInput , signinInput ,postInput,updatepost}   from  "@priyammm22/common-medium"
// import { title } from 'process';
// import { string } from 'zod';



type CustomContext = {
  prisma: PrismaClient,
  userId: string
}

const v1 = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    KEY: string
  },
  Variables: CustomContext
}>()


// middleware 

v1.use('/blog/*', async (c, next) => {
  console.log("in the middleware");
  const jwt = c.req.header('Authorization');
  if (!jwt) {
    return c.json({ error: "unauthorized" });
  }
  const token = jwt.split(' ')[1];
  const payload = await verify(token, c.env.KEY);
  if (!payload) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
  console.log("id in md", payload.id);
  c.set("userId", payload.id);

  await next();

});
v1.post('/signup', async function (c) {
  const prisma = c.get("prisma") as PrismaClient;
  const body = await c.req.json();
  
   const {success,error}   = signupInput.safeParse(body);
   if(!success) { 
    console.log(error.errors);
    let message = ""

    for(let i=0;i<error.errors.length;i++){
      message+=(error.errors[i].message);
      message+='|'
    }
     return c.json({message:message},411);
   } 

  const ispresent = await prisma.User.findUnique({
    where: { email: body.email }
  });
  if (!(ispresent == null)) {
    return c.json({ message: "User already exists or this email is already used" }, 409);
  }
  const user = await prisma.User.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password,
    },
  })
  console.log(user);

  const token = await sign({ id: user.id }, c.env.KEY);
  console.log(token);
  return c.json({
    jwt: token
  })

})

v1.post('/signin', async function (c) {
  const prisma = c.get("prisma") as PrismaClient;
  const body = await c.req.json();
  // console.log(body);

  const {success,error } = signinInput.safeParse(body);

  if(!success) { 
    console.log(error.errors);
    let message = ""

    for(let i=0;i<error.errors.length;i++){
      message+=(error.errors[i].message);
      message+='|'
    }
     return c.json({message:message},411);
   } 

  const ispresent = await prisma.User.findUnique({
    where: { email: body.email }
  })
  if (ispresent == null) return c.json({ message: "Email not exist please do sign-up" }, 409);
  const PasswordIsCorrect = await prisma.User.findUnique({
    where: { email: body.email, password: body.password }
  })
  if (PasswordIsCorrect == null) return c.json({ message: "password is incorrect" }, 401);

  const token = await sign({ id: PasswordIsCorrect.id }, c.env.KEY);
  return c.json({ jwt: token });

})

v1.post('/blog', async function (c) {
  const prisma = c.get("prisma") as PrismaClient;
  const body = await c.req.json();
  const userId = c.get('userId');
  // console.log(body);
  // const decoded =await verify(body.jwt,c.env.KEY);
  const blog = await prisma.Post.create({
    data: {
      title: body.title,
      content: body.content,
      published: body.public,
      authorId: userId
    }
  })
  console.log(blog);
  return c.json({ message: "blog created succesfully" });

})

v1.put('/blog', async function (c) {
  const prisma = c.get('prisma') as PrismaClient;
  const userId = c.get('userId');
  const body = await c.req.json();
  const isFound = await prisma.Post.findUnique({ where: { id: body.id } });
  // console.log("check of found", isFound);
  if (!isFound) {
    c.status(411);
    return c.json({ error: "wrong blog to edit " });
  }

  const data = {};
  data.id = body.id;
  data.title = body.title ? body.title : isFound.title;
  data.content = body.content ? body.content : isFound.content;
  data.published = body.published ? body.published : isFound.published;
  data.authorId = userId;

  // if (Object.keys(data).length === 0) {
  //   return c.json({ error: 'No valid fields provided for update' }, 400);
  // }
  // console.log(data);
  await prisma.Post.update({
    where: { id: body.id, authorId: userId },
    data: data,
  });


  return c.json({ message: "Post has been updated!" });
})


v1.get('/blog/bulk', async function (c) {

  const prisma = c.get("prisma") as PrismaClient;

  const blog = await prisma.Post.findMany({

  });
  return c.json(blog);
})

v1.get('/blog/author', async function (c) {
  const userId = c.get('userId');
  const prisma = c.get('prisma') as PrismaClient;
  // console.log(userId);
  console.log(userId);
  const blogs = await prisma.Post.findMany({
    where: { authorId: userId }
  })
  console.log(blogs);
  return c.json({ blog: blogs });

})
v1.get('/blog/:id', async function (c) {
  const id = c.req.param('id');
  const prisma = c.get('prisma') as PrismaClient;

  const blog = await prisma.Post.findUnique({
    where: { id: id }
  })
  if (!blog) return c.json({ error: "no blog found " });
  return c.json({ blog });

})
export default v1;
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const kv = await Deno.openKv();

const app = new Application();
const router = new Router();

router.post("/", async (context) => {
  const { url } = await context.request.body.json();
  if (!url) {
    context.response.status = 400;
    context.response.body = { error: "URL is required" };
    return;
  }

  const short = Math.random().toString(36).substring(2, 8);
  await kv.set(["urls", short], url);

  context.response.body = { short };
});

router.get("/:short", async (context) => {
  const { short } = context.params;
  const url = await kv.get(["urls", short]);

  if (url.value) {
    context.response.redirect(url.value as string);
  } else {
    context.response.status = 404;
    context.response.body = "URL not found";
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (context) => {
    await context.send({
        root: `${Deno.cwd()}/public`,
        index: "index.html"
    })
})

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });

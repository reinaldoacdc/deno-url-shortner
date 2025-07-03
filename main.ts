import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const kv = await Deno.openKv();

const app = new Application();
const router = new Router();

router.post("/", async (context) => {
  const { url } = await context.request.body.json();
  if (!url || !URL.canParse(url)) {
    context.response.status = 400;
    context.response.body = { error: "A valid URL is required" };
    return;
  }

  const short = Math.random().toString(36).substring(2, 8);
  await kv.set(["urls", short], url);

  context.response.body = { short };
});

router.get("/list", async (context) => {
    const entries = kv.list({ prefix: ["urls"] });
    const urls: Array<any> = [];
    for await (const entry of entries) {
        urls.push({
            short: entry.key[1],
            original: entry.value,
        });
    }
    context.response.body = urls;
});

router.get("/:short([a-z0-9]{6})", async (context) => {
  const { short } = context.params;
  if (!short) {
    context.response.status = 404;
    context.response.body = "Not Found";
    return;
  }
  
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

app.use(async (context, next) => {
  try {
    await context.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });

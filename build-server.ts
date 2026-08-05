import { readdir } from "node:fs/promises";
import { URL } from "node:url";

// static file server
Bun.serve({
  async fetch(req) {
    const files = await readdir('./dist')
    const pathname = (new URL(req.url).pathname).replace(/^\//, '')
    console.log('comparing pathname to files', pathname, files)
    const found = files.find(f => f === pathname)
    let resp = !found ? new Response('404 :(') : new Response(Bun.file("./dist/" + found))
    resp.headers.set('Access-Control-Allow-Origin', '*');
    resp.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    return resp
  },
  port: 8080
});
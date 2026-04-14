import "./load-env";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { startCronJobs } from "./lib/cron";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> KillerCutz running on http://localhost:${port}`);
    startCronJobs();
  });
});

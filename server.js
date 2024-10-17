const http = require("http");
const url = require("url");

const routes = require("./routes");

const host = "localhost";
const port = 8080;

const notFound = (req, res) => {
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: "This endpoint does not exist.",
      code: 404,
      success: false,
    }),
  );
};

const requestListener = (req, res) => {
  const parsedURL = url.parse(req.url, true);
  const { pathname } = parsedURL;

  // Ignore favicon requests
  if (pathname == "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log("[*] Request incoming:", pathname);

  const route = routes[pathname] || notFound;
  route(req, res);
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

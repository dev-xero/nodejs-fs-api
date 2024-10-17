const routes = {
  "/": (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        message: "NodeJS File Management API, All Systems OK.",
        code: 200,
        success: true,
    }));
  },
  "/files": (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        message: "All files here.",
        code: 200,
        success: true,
    }));
  }
}

module.exports = routes;

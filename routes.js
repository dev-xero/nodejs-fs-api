const FileManagementService = require("./services");
const { parseBoundary } = require("./utils");

const fileManagementService = new FileManagementService();

const routes = {
  "/": (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        message: "NodeJS File Management API, All Systems OK.",
        code: 200,
        success: true,
    }));
  },
  "/upload": (req, res) => {
    if (!res.method == 'POST') {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
          message: "Method not allowed.",
          code: 405,
          success: false
      }));
      return;
    }

    const contentType = req.headers['content-type'];
    if (!contentType.includes('multipart/form-data')) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
          message: "Content-Type not allowed, use multipart/form-data.",
          code: 400,
          success: false
      }));
      return;
    }

    // so multipart/form-data separates message data by boundaries
    const boundary = parseBoundary(contentType);
    if (!boundary) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
          message: "Bad request, no boundary found.",
          code: 400,
          success: false
      }));
      return;
    }

    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const parts = body.split(`--${boundary}`);
      fileManagementService.upload(parts)
    })

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
        message: "File uploaded.",
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

const url = require("url");
const { parseBoundary, parseMultipartFormData } = require("./utils");

const FileManagementService = require("./services");
const fileManagementService = new FileManagementService();

const routes = {
  "/": (req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "NodeJS File Management API, All Systems OK.",
        code: 200,
        success: true,
      }),
    );
  },
  "/upload": (req, res) => {
    if (req.method != "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Method not allowed.",
          code: 405,
          success: false,
        }),
      );
      return;
    }

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Content-Type not allowed, use multipart/form-data.",
          code: 400,
          success: false,
        }),
      );
      return;
    }

    // so multipart/form-data separates message data by boundaries
    const boundary = parseBoundary(contentType);
    if (!boundary) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Bad request, no boundary found.",
          code: 400,
          success: false,
        }),
      );
      return;
    }

    let body = []; // byte array

    req.on("data", (chunk) => body.push(chunk));

    req.on("end", () => {
      bytes = Buffer.concat(body);
      // console.log("[D] Total body length:", bytes.length);
      const parts = parseMultipartFormData(bytes, boundary);

      try {
        fileInfo = fileManagementService.uploadFile(parts);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "File uploaded successfully.",
            code: 200,
            success: true,
            metadata: fileInfo,
          }),
        );
      } catch (error) {
        console.error("[x] File could not be uploaded, err:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "File could not be uploaded.",
            code: 500,
            success: false,
          }),
        );
      }
    });
  },
  "/files": (req, res) => {
    try {
      const files = fileManagementService.getAllFiles();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Successfully read all files.",
          code: 200,
          success: true,
          files,
        }),
      );
    } catch (error) {
      console.error("[x] Error reading files, err:", error);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "No files uploaded or metadata registry is not available.",
          code: 200,
          success: true,
        }),
      );
    }
  },
  "/files/": (req, res) => {
    const parsedURL = url.parse(req.url, true);
    // console.log("[*] Path name:", parsedURL.pathname);
    const urlParts = parsedURL.pathname.split("/");

    if (urlParts.length == 4 && urlParts.pop() == "metadata") {
      try {
        const metadata = fileManagementService.getFileMetadata(urlParts.pop())
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Successfully read metadata.",
            code: 200,
            success: true,
            metadata,
          }),
        );
        return;
      } catch (error) {
        console.error("[x] Error reading metadata.json file:", error);
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "File metadata not found.",
            code: 404,
            success: false,
          }),
        );
        return;
      }
    }

    const filename = urlParts.pop();

    if (!filename) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Bad request, provide a filename.",
          code: 400,
          success: true,
        }),
      );
      return;
    }

    try {
      const { content, mimeType } =
        fileManagementService.getFileFromName(filename);
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(content);
    } catch (error) {
      console.error("[x] File could not be read, err:", error);
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "File not found.",
          code: 404,
          success: false,
        }),
      );
    }
  },
};

module.exports = routes;

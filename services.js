const path = require("path");
const fs = require("fs");

class FileManagementService {
  constructor() {}

  uploadFile(parts) {
    parts.forEach((part) => {
      if (part.includes("Content-Disposition")) {
        // Extract the file name
        const fileNameMatch = part.match(/filename="(.+)"/);
        const filename = fileNameMatch ? fileNameMatch[1].trim() : null;

        // Extract MIME type
        const contentTypeMatch = part.match(/Content-Type: (.+)/);
        const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : null;

        // Get file data with file size
        const fileData = part.split("\r\n\r\n")[1].split("\r\n--")[0];
        const fileSize = Buffer.byteLength(fileData, "binary");

        // TODO: Encrypt file names using crypto
        if (filename) {
          console.log("File Uploaded:");
          console.log("- [+] File Name:", filename);
          console.log("- [+] MIME Type:", mimeType);
          console.log("- [+] File Size:", fileSize, "bytes");

          // Update metadata registry
          const metadataFilePath = path.join(__dirname, "metadata.json");
          let metadataArray = [];

          try {
            if (fs.existsSync(metadataFilePath)) {
              const existingMetadata = fs.readFileSync(metadataFilePath, "utf8");
              metadataArray = JSON.parse(existingMetadata);
            }
          } catch (error) {
            console.error("[x] Error reading metadata.json file:", error);
          }

          metadataArray.push({
            filename,
            mimeType,
            fileSize,
            uploadedAt: new Date().toISOString()
          });

          // Attempt to write this entry
          try {
            fs.writeFileSync(metadataFilePath, JSON.stringify(metadataArray, null, 2));
            console.log("[+] Metadata updated successfully!");

          } catch (error) {
            console.error("[x] Error writing metadata.json file:", error);
          }
        }
      }
    });
  }
}

module.exports = FileManagementService;

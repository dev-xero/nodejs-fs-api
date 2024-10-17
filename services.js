const path = require("path");
const fs = require("fs");

class FileManagementService {
  constructor() {}

  // Handles upadting the metadata registry
  updateMetadata(filename, mimeType, fileSize) {
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
      uploadedAt: new Date().toISOString(),
    });

    // Attempt to write this entry
    try {
      fs.writeFileSync(
        metadataFilePath,
        JSON.stringify(metadataArray, null, 2),
      );
      console.log("[+] Metadata updated successfully.");
    } catch (error) {
      console.error("[x] Error writing metadata.json file:", error);
    }
  }

  // Creates the uploads directory if it doesn't exist
  prepareToUpload() {
    const uploadDir = path.join(__dirname, "uploaded");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  // Parses multipart form data and writes the file after updating metadata
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
          console.log("File Metadata:");
          console.log("\t[-] File Name:", filename);
          console.log("\t[-] MIME Type:", mimeType);
          console.log("\t[-] File Size:", fileSize, "bytes");

          // Update metadata registry
          this.updateMetadata(filename, mimeType, fileSize);

          this.prepareToUpload();

          // Write this file to the uploads directory
          const filepath = path.join(__dirname, "uploaded", filename);
          fs.writeFileSync(filepath, fileData, "binary");
          console.log("[+] File uploaded successfully.");
        }
      }
    });
  }
}

module.exports = FileManagementService;

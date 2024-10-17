const path = require("path");
const fs = require("fs");

class FileManagementService {
  constructor() {
    this.uploadDir = path.join(__dirname, "uploaded");
  }

  // Handles updating the metadata registry
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
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Parses multipart form data and writes the file after updating metadata
  uploadFile(parts) {
    this.prepareToUpload();

    // Extract file metadata from content-disposition header
    for (const part of parts) {
      const contentDisposition = part.headers["content-disposition"];
      if (contentDisposition && contentDisposition.includes("filename")) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : "unknown";
        const mimeType = part.headers["content-type"];
        const fileContent = part.content;
        const fileSize = fileContent.length;

        console.log("File Metadata:");
        console.log("\t[-] File Name:", filename);
        console.log("\t[-] MIME Type:", mimeType);
        console.log("\t[-] File Size:", fileSize, "bytes");

        this.updateMetadata(filename, mimeType, fileSize);

        // TODO: Hash file names using crypto package

        const filepath = path.join(this.uploadDir, filename);
        fs.writeFileSync(filepath, fileContent, "binary");
        console.log("[+] File uploaded successfully.");
        return { filename, mimeType, fileSize };
      }
    }
    throw new Error("No file found in the request");
  }
}

module.exports = FileManagementService;

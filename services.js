const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

class FileManagementService {
  constructor() {
    this.uploadDir = path.join(__dirname, "uploaded");
    this.metadataFilePath = path.join(__dirname, "metadata.json");
  }

  makeUrlFriendly(filename) {
    return filename
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-\.]/g, "")
      .replace(/--+/g, "-")
      .replace(/\.+/g, ".");
  }

  // Hashes file name and returns a hexadecimal string
  hashFilename(filename) {
    const hash = crypto.createHash("sha256");

    // we need to avoid collisions
    hash.update(filename + Date.now());
    return hash.digest("hex");
  }

  // Handles updating the metadata registry
  updateMetadata(filename, hashname, mimeType, fileSize) {
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
      hashname,
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

        const safeFilename = this.makeUrlFriendly(filename);
        const filenameHash = this.hashFilename(safeFilename); // the same file name will produce the same hash
        const extName = safeFilename.split(".")[1];

        this.updateMetadata(safeFilename, filenameHash, mimeType, fileSize);

        const filepath = path.join(
          this.uploadDir,
          `${filenameHash}.${extName}`,
        ); // use the hashed filename instead

        fs.writeFileSync(filepath, fileContent, "binary");
        console.log("[+] File uploaded successfully.");
        return { safeFilename, mimeType, fileSize };
      }
    }
    throw new Error("No file found in the request");
  }


  // Returns the file content and mime type if it exists
  getFileFromName(filename) {
    const metadata = JSON.parse(fs.readFileSync(this.metadataFilePath, "utf8"));
    const filemeta = metadata.find((file) => file.filename == filename);
    if (!filemeta) {
      throw new Error("This file does not exist.");
    }
    const extName = filename.split(".")[1];
    const savedFilePath = path.join(
      this.uploadDir,
      `${filemeta.hashname}.${extName}`,
    );
    return {
      content: fs.readFileSync(savedFilePath),
      mimeType: filemeta.mimeType,
    };
  }

  // Lists endpoints for all registered files
  getAllFiles() {
    const metadata = JSON.parse(fs.readFileSync(this.metadataFilePath, "utf8"));
    const filepaths = [];
    for (const filemeta of metadata) {
      filepaths.push(`http://localhost:8080/files/${filemeta.filename}`);
    }
    return filepaths;
  }

  // Returns file metadata if present
  getFileMetadata(filename) {
    const metadata = JSON.parse(fs.readFileSync(this.metadataFilePath, "utf8"));
    const filemeta = metadata.find((file) => file.filename == filename);
    if (!filemeta) {
      throw new Error("This file does not exist.");
    }
    return filemeta;
  }
}

module.exports = FileManagementService;

# NodeJS File Management API

This repository contains source code for the NitHub file management server project written in 100% pure NodeJS. The server uses many of the in-built packages provided by NodeJS such as `http`, `fs`, `path`, `crypto` etc, to perform various CRUD operations relating to file management. It allows clients to upload, list, and delete files, as well as to view metadata associated with them. Each file is saved on disk using a unique hexadecimal hash with a timestamp to prevent overwriting / collisions.

## API Design Spec Sheet (NitHub)

### 1. File Upload
  - Implement an HTTP endpoint (e.g., `/upload`) that allows users to upload files using multipart/form-data.
  - Use the fs module to store the uploaded files on the server’s file system.
  - Generate unique filenames for uploads (using crypto or custom logic).
  - Save file metadata (original name, size, MIME type, upload time) in a JSON file for reference.
    
### 2. File Retrieval
  - Implement an HTTP endpoint (e.g., `/files/:filename`) to retrieve the uploaded file.
  - Use the fs module to read the file from the disk and send it as a response.
  - Handle file not found errors appropriately.

### 3. File Metadata Retrieval
  - Implement an HTTP endpoint (e.g., `/files/:filename/metadata`) that returns the stored metadata of a file.
  - Return details like original file name, size, and upload timestamp.

### 4. File Deletion:
  - Implement an HTTP endpoint (e.g., `/files/:filename/delete`) to delete a file from the system.
  - Ensure the file and its metadata are deleted properly.

### 5. List Files:
  - Implement an HTTP endpoint (e.g., `/files`) to return a list of all uploaded files with their metadata.
  - Use the `fs.readdir` method to get the list of files in the directory.

## Requirements

1. No External Libraries: Use only Node.js core modules.
2. Asynchronous I/O: Ensure all file and HTTP operations are non-blocking.
3. Error Handling: Properly handle file system errors (e.g., file not found, read/write errors).
4. Routing: Build a simple routing system using the url module to handle different HTTP methods (GET, POST, DELETE).
5. Security Considerations: Handle large file uploads safely, limit file sizes, and prevent directory traversal attacks.

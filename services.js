const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

class FileManagementService {
    constructor() {
        this.uploadDir = path.join(__dirname, 'uploaded');
        this.metadataFilePath = path.join(__dirname, 'metadata.json');
    }

    // Modifies filenames to be more url friendly
    makeUrlFriendly(filename) {
        return filename
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-\.]/g, '')
            .replace(/--+/g, '-')
            .replace(/\.+/g, '.');
    }

    // Hashes file name and returns a hexadecimal string
    hashFilename(filename) {
        const hash = crypto.createHash('sha256');

        // we need to avoid collisions
        hash.update(filename + Date.now());
        return hash.digest('hex');
    }

    // Async reads metadata content from fs
    async readMetadata() {
        try {
            await fs.access(this.metadataFilePath);
            const data = await fs.readFile(this.metadataFilePath, 'utf-8');
            const parsedData = JSON.parse(data);

            return Object.keys(parsedData).length != 0 ? parsedData : [];
        } catch (error) {
            if (error.code == 'ENOENT') {
                return []; // just create a new array
            } else {
                console.error('[x] Error reading metadata.json file.');
                throw error;
            }
        }
    }

    // Async handles updating the metadata registry
    async updateMetadata(filename, hashname, mimeType, fileSize) {
        try {
            const metadataArray = await this.readMetadata();

            metadataArray.push({
                filename,
                hashname,
                mimeType,
                fileSize,
                uploadedAt: new Date().toISOString(),
            });
            await fs.writeFile(
                this.metadataFilePath,
                JSON.stringify(metadataArray, null, 2)
            );
            console.log('[+] Metadata updated successfully.');
        } catch (error) {
            console.error('[x] Error updating metadata registry.');
            throw error;
        }
    }

    // Creates the "uploads" directory if it doesn't exist
    async prepareToUpload() {
        try {
            await fs.access(this.uploadDir);
        } catch (error) {
            if (error.code == 'ENOENT') {
                try {
                    await fs.mkdir(this.uploadDir, { recursive: true });
                } catch (mkdirErr) {
                    console.error('[x] Error creating uploads directory.');
                    throw mkdirErr;
                }
            } else {
                console.error('[x] Unknown error occurred:', error);
                throw error;
            }
        }
    }

    // Parses multipart form data and writes the file after updating metadata
    async uploadFile(parts) {
        await this.prepareToUpload();

        // Extract file metadata from content-disposition header
        for (const part of parts) {
            const contentDisposition = part.headers['content-disposition'];
            if (contentDisposition && contentDisposition.includes('filename')) {
                const filenameMatch =
                    contentDisposition.match(/filename="(.+)"/);
                const filename = filenameMatch ? filenameMatch[1] : 'unknown';
                const mimeType = part.headers['content-type'];
                const fileContent = part.content;
                const fileSize = fileContent.length;

                console.log('File Metadata:');
                console.log('\t[-] File Name:', filename);
                console.log('\t[-] MIME Type:', mimeType);
                console.log('\t[-] File Size:', fileSize, 'bytes');

                const safeFilename = this.makeUrlFriendly(filename);
                const filenameHash = this.hashFilename(safeFilename); // the same file name will produce the same hash
                const extName = safeFilename.split('.')[1];

                await this.updateMetadata(
                    safeFilename,
                    filenameHash,
                    mimeType,
                    fileSize
                );

                // use the hashed filename instead
                const filepath = path.join(
                    this.uploadDir,
                    `${filenameHash}.${extName}`
                );

                try {
                    await fs.writeFile(filepath, fileContent, 'binary');
                    console.log('[+] File uploaded successfully.');
                    return { filename: safeFilename, mimeType, fileSize };
                } catch (error) {
                    console.error('[x] Error writing file:', error);
                    throw error;
                }
            }
        }
        throw new Error('No file found in the request');
    }

    // Returns the file content and mime type if it exists
    async getFileFromName(filename) {
        const metadata = await this.readMetadata();
        const fileMeta = metadata.find((file) => file.filename == filename);

        if (!fileMeta) {
            throw new Error('This file does not exist.');
        }

        const extName = filename.split('.')[1];
        const savedFilePath = path.join(
            this.uploadDir,
            `${fileMeta.hashname}.${extName}`
        );

        const content = await fs.readFile(savedFilePath);
        console.log(
            '[+] Successfully served file:',
            `${fileMeta.hashname}.${extName}`
        );

        return {
            content,
            mimeType: fileMeta.mimeType,
        };
    }

    // Lists endpoints for all registered files
    async getAllFiles() {
        const metadata = await this.readMetadata();
        const filepaths = [];

        for (const fileMeta of metadata) {
            filepaths.push(`http://localhost:8080/files/${fileMeta.filename}`);
        }

        console.log('[+] Successfully served all files.');
        return filepaths;
    }

    // Returns file metadata if present
    async getFileMetadata(filename) {
        const metadata = await this.readMetadata();
        const fileMeta = metadata.find((file) => file.filename == filename);

        if (!fileMeta) {
            throw new Error('This file does not exist.');
        }

        console.log('[+] Successfully served file metadata.');
        return fileMeta;
    }

    // Deletes a file from the registry and the file system
    async deleteFile(filename) {
        const metadata = await this.readMetadata();
        const fileMeta = metadata.find((file) => file.filename == filename);

        if (!fileMeta) {
            throw new Error('This file does not exist.');
        }

        const extName = filename.split('.')[1];
        const filepath = path.join(
            this.uploadDir,
            `${fileMeta.hashname}.${extName}`
        );

        try {
            await fs.unlink(filepath); // so apparently nodejs calls deletion "unlink"
            metadata.splice(metadata.indexOf(fileMeta), 1);

            await fs.writeFile(
                this.metadataFilePath,
                JSON.stringify(metadata, null, 2)
            );

            console.log('[+] File deleted successfully.');
        } catch (error) {
            console.error('Unable to complete this request:', error);
            throw error;
        }
    }
}

module.exports = FileManagementService;

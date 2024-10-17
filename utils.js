function parseBoundary(contentType) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? match[1] || match[2] : null;
}

function parseMultipartFormData(body, boundary) {
  const parts = [];
  const boundaryBytes = Buffer.from(`\r\n--${boundary}`);
  let startIdx = body.indexOf(Buffer.from(`--${boundary}`)); // initial boundary

  while (startIdx != -1) {
    startIdx += boundaryBytes.length;
    let endIdx = body.indexOf(boundaryBytes, startIdx);

    if (endIdx == -1) {
      endIdx = body.indexOf(Buffer.from(`\r\n--${boundary}--`), startIdx);
      if (endIdx == -1) break;
    }

    // extract headers and content
    const part = body.slice(startIdx, endIdx);
    const headerEndIdx = part.indexOf(Buffer.from("\r\n\r\n"));

    if (headerEndIdx != -1) {
      const headers = part.slice(0, headerEndIdx).toString();
      const content = part.slice(headerEndIdx + 4); // +4 for the \r\n\r\n

      const headerLines = headers.split("\r\n");
      const parsedHeaders = {};

      for (const line of headerLines) {
        const [key, value] = line.split(": ");
        if (key && value) {
          parsedHeaders[key.toLowerCase()] = value;
        }
      }

      parts.push({ headers: parsedHeaders, content });
    }

    startIdx = endIdx;

    // we've reached the end
    if (body.indexOf(Buffer.from(`\r\n--${boundary}--`), startIdx) !== -1) {
      break;
    }
  }

  return parts;
}

module.exports = { parseBoundary, parseMultipartFormData };

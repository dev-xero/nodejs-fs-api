const parseBoundary = (header) => {
  const matches = header.match(/boundary=(.+)$/);
  return matches && matches[1] ? matches[1] : null;
}

modules.exports = { parseBoundary }

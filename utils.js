const parseBoundary = (header) => {
  const matches = header.match(/boundary=(.+)$/);
  return matches && matches[1] ? matches[1] : null;
};

module.exports = { parseBoundary };

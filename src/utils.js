const generateId = (array) => {
  if (array.length) {
    return array[array.length - 1].id + 1;
  }

  return 1;
};

module.exports = { generateId };

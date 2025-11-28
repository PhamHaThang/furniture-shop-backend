const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `FS${timestamp}${random}`;
};
module.exports = { generateOrderCode };

export const sendError = (res, status, message, code) => {
  const payload = { message };
  if (code) {
    payload.code = code;
  }
  return res.status(status).json(payload);
};


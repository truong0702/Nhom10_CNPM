export const errorHandler = (err, req, res, next) => {
  console.error("[errorHandler]", {
    message: err?.message,
    stack: err?.stack,
    path: req?.originalUrl,
    method: req?.method,
    body: req?.body,
    params: req?.params,
    query: req?.query,
  });
  res.status(err?.status || 500).json({ error: err?.message || "Internal Server Error" });
};

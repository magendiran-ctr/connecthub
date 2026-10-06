export const notFound = (req, res) =>
  res.status(404).json({ message: "Route not found" });
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
};

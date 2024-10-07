const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message;
  const stack = err.stack;
  console.log(err);
  res.status(statusCode).send({ message, stack });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);

  res.status = 404;

  next(error);
};

module.exports = { notFound, errorHandler };

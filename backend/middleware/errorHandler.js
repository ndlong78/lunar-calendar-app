const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    message: isProduction ? 'Internal server error' : err.message || 'Server error'
  };

  if (!isProduction) {
    response.error = err;
  }

  return res.status(500).json(response);
};

module.exports = errorHandler;
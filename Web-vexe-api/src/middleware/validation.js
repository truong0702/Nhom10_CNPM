import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details.map((d) => d.message).join(', '),
      });
    }

    req.validatedData = value;
    next();
  };
};

export default validate;

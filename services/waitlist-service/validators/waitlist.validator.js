const Joi = require('joi');

const waitlistSchema = Joi.object({
  date: Joi.date().iso().required(),
  clientId: Joi.string().hex().length(24).required(),
  workerId: Joi.string().hex().length(24).optional(),
  procedureId: Joi.string().hex().length(24).required()
});

const notifySchema = Joi.object({
  date: Joi.date().iso().required(),
  workerId: Joi.string().hex().length(24).optional()
});

const validateWaitlist = (req, res, next) => {
  const { error } = waitlistSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

const validateNotify = (req, res, next) => {
  const { error } = notifySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

module.exports = { validateWaitlist, validateNotify };

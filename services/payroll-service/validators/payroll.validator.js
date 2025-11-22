const Joi = require('joi');

const commissionRateSchema = Joi.object({
  workerId: Joi.string().hex().length(24).required(),
  rate: Joi.number().min(0).max(1).required()
});

const payoutSchema = Joi.object({
  workerId: Joi.string().hex().length(24).required(),
  amount: Joi.number().min(0).required(),
  periodStart: Joi.date().iso().required(),
  periodEnd: Joi.date().iso().required(),
  status: Joi.string().valid('pending', 'paid').optional()
});

const validateCommissionRate = (req, res, next) => {
  const { error } = commissionRateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

const validatePayout = (req, res, next) => {
  const { error } = payoutSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

module.exports = { validateCommissionRate, validatePayout };

const Joi = require('joi');

const auditLogSchema = Joi.object({
  actorId: Joi.string().hex().length(24).required(),
  action: Joi.string().required(),
  resourceId: Joi.string().optional(),
  details: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
  ipAddress: Joi.string().ip().optional()
});

const validateAuditLog = (req, res, next) => {
  const { error } = auditLogSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

module.exports = { validateAuditLog };

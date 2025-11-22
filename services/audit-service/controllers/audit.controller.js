const AuditLog = require('../models/AuditLog');

const createLog = async (req, res) => {
  try {
    const { actorId, action, resourceId, details, ipAddress } = req.body;

    const log = new AuditLog({
      actorId,
      action,
      resourceId,
      details,
      ipAddress
    });

    await log.save();

    res.status(201).json({ 
      message: 'Log created', 
      logId: log._id 
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const getLogs = async (req, res) => {
  try {
    const { 
      actorId, 
      action, 
      dateFrom, 
      dateTo, 
      resourceId,
      page = 1,
      limit = 100
    } = req.query;

    const filter = {};

    if (actorId) {
      filter.actorId = actorId;
    }

    if (action) {
      filter.action = action;
    }

    if (resourceId) {
      filter.resourceId = resourceId;
    }

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.timestamp.$lte = new Date(dateTo);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findById(id)
      .populate('actorId', 'name email role');

    if (!log) {
      return res.status(404).json({ 
        message: 'Log not found' 
      });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

const getActionTypes = async (req, res) => {
  try {
    const actions = await AuditLog.distinct('action');
    res.json(actions.sort());
  } catch (error) {
    console.error('Error fetching action types:', error);
    res.status(500).json({ 
      message: 'Server error' 
    });
  }
};

module.exports = {
  createLog,
  getLogs,
  getLogById,
  getActionTypes
};

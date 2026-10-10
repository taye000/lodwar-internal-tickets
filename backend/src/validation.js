import { body, query, param, validationResult } from 'express-validator';

export const STATUSES = ['open', 'in_progress', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high'];

// Runs after the rules; returns 400 with all errors if any rule failed
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

export const createTicketRules = [
  body('title')
    .exists().withMessage('title is required').bail()
    .isString().withMessage('title must be a string').bail()
    .trim()
    .notEmpty().withMessage('title cannot be empty')
    .isLength({ max: 255 }).withMessage('title must be at most 255 characters'),
  body('description')
    .optional({ values: 'null' })
    .isString().withMessage('description must be a string')
    .trim(),
  body('status')
    .optional()
    .isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),
];

export const listTicketsRules = [
  query('status')
    .optional()
    .isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
    .toInt(),
];

export const updateTicketRules = [
  param('id')
    .isInt({ min: 1, max: 2147483647 }).withMessage('id must be a positive integer')
    .toInt(),
  body('status')
    .optional()
    .isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`),
  body().custom((value) => {
    const b = value ?? {};
    if (b.status === undefined && b.priority === undefined) {
      throw new Error('provide status and/or priority');
    }
    return true;
  }),
];
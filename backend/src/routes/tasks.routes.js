const express = require('express');
const router = express.Router({ mergeParams: true });
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { isMember, isAdmin } = require('../middleware/role');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/tasks.controller');

router.use(authenticate);
router.use(isMember);

router.get('/', getTasks);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
], createTask);

router.put('/:taskId', updateTask);
router.delete('/:taskId', isAdmin, deleteTask);

module.exports = router;

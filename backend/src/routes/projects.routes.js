const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { isMember, isAdmin } = require('../middleware/role');
const {
  getProjects, getProject, createProject, updateProject,
  deleteProject, addMember, removeMember
} = require('../controllers/projects.controller');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);

router.get('/:projectId', isMember, getProject);
router.put('/:projectId', isAdmin, [
  body('name').trim().notEmpty().withMessage('Name is required'),
], updateProject);
router.delete('/:projectId', isAdmin, deleteProject);

router.post('/:projectId/members', isAdmin, addMember);
router.delete('/:projectId/members/:userId', isAdmin, removeMember);

module.exports = router;

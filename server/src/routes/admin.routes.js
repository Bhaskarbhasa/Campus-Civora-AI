const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/admin.controller');
const { protect, authorizeAny } = require('../middleware/auth.middleware');

// Protect all admin routes
router.use(protect);

// Allow wardens, super_admin, and maintenance supervisors to manage their staff
router.use(authorizeAny('warden', 'chief_warden', 'maintenance_supervisor', 'dean', 'director'));

router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;

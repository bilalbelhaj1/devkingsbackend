// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// routes/admin.js
router.get('/dashboard/overview', adminController.getOverviewStats);
router.get('/dashboard/sales-performance', adminController.getSalesPerformance);
router.get('/dashboard/enrollment-vs-completion', adminController.getEnrollmentVsCompletion);
router.get('/dashboard/popular-categories', adminController.getPopularCategories);
router.get('/dashboard/recent-transactions', adminController.getRecentTransactions);
router.get('/dashboard/top-learners', adminController.getTopLearners);
router.get('/dashboard/top-teachers', adminController.getTopTeachers);
router.get('/dashboard/top-courses', adminController.getTopCourses);

router.get('/users/getAllUsers', adminController.getAllUsers);
router.put('/users/updateUser/:userId', adminController.updateUser);
router.post('/users/addAdmin', adminController.addAdmin);
router.delete('/users/deleteUser/:userId',adminController.deleteUser);

router.get('/lessons/all', adminController.getAllLessons);
router.get('/courses/all', adminController.getAllCourses);
router.delete('/courses/:courseId', adminController.deleteCourse);
router.delete("/lessons/:lessonId", adminController.deleteLesson);
router.post('/login', adminController.loginAdmin)
module.exports = router;

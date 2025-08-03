const express = require('express')
const {
    getTeachers,
    getTopCourses,
    getAllCourses,
    getCourseDetails,
    getHomepageContent
} = require('../controllers/publicControllers')
const router = express.Router();

router.get('/teachers', getTeachers);
router.get('/TopCourses', getTopCourses);
router.get('/AllCourses',getAllCourses);
router.get('/course/:courseId', getCourseDetails)
router.get('/Home', getHomepageContent)
module.exports = router;




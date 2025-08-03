const express = require('express');
const { authenticate, authorization } = require('../middlewares/authMiddleware');
const {
    AddCourse,
    getAllCourses,
    getCourse,
    deleteCourse,
    updateCourse,
    addLesson,
    getAllLessons,
    getLesson,
    deleteLesson,
    updateLesson,
    addResourceToLesson,
    addResourceToCourse,
    deleteResourceFromLesson,
    deleteResourceFromCourse,
    createFaq,
    updateFaq,
    deleteFaq,
    createQuiz,
    getQuiz,
    addQuestionToQuiz,
    teacherHome,
    getOverviewStats,
    getSalesPerformance,
    getEnrollmentVsCompletion,
    getRecentTransactions,
    getTopLearners,
    getTopCourses,
    updateQuiz,
} = require('../controllers/teacherController');
const { uploadImage, uploadVideo } = require('../utils/upload');
const router =  express.Router();


router.use(authenticate);
router.use(authorization('teacher'));

router.get('/home', teacherHome);
router.post('/course', uploadImage.single('thumbnail'), AddCourse);
/* router.put("/profile", uploadImage.single("profilePic"), updateTeacherProfile); */
router.get('/courses', getAllCourses);
router.get('/course/:courseId', getCourse);
router.put('/course/:courseId',uploadImage.single('thumbnail'), updateCourse);
router.delete('/course/:courseId', deleteCourse);


router.post('/lesson/:courseId', uploadVideo.single('video_lesson'), addLesson);
router.get('/lessons/:courseId', getAllLessons);
router.get('/lesson/:lessonId', getLesson);
router.put('/lesson/:lessonId',uploadVideo.single('video_lesson') ,updateLesson);
router.delete('/lesson/:lessonId', deleteLesson);


router.post('/lesson/:lessonId/addResource', addResourceToLesson);
router.post('/course/:courseId/addResource', addResourceToCourse);
router.delete('/lesson/:lessonId/deleteResource', deleteResourceFromLesson);
router.delete('/course/:courseId/deleteResource', deleteResourceFromCourse);

router.post("/course/:courseId/faqs", createFaq); // Create FAQ
router.put("/faqs/:id", updateFaq); // Update FAQ
router.delete("/faqs/:id", deleteFaq); // Delete FAQ
module.exports = router;

// Quiz route
router.post('/course/:courseId/Quiz', createQuiz)
router.get('/Quiz/:courseId',getQuiz)
router.post('/course/:quizId/questions',addQuestionToQuiz)
router.put('/quiz/:quizId',updateQuiz)

// dashboard Routes
router.get('/dashboard/overview',getOverviewStats)
router.get('/dashboard/sales-performance', getSalesPerformance)
router.get('/dashboard/enrollment-vs-completion',getEnrollmentVsCompletion)
router.get('/dashboard/recent-transactions',getRecentTransactions)
router.get('/dashboard/top-learners',getTopLearners)
router.get('/dashboard/top-courses',getTopCourses)
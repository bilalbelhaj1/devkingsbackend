const express = require("express");
const router = express.Router();

const {
    updateProfile,
    StripePayment,
    logout,
    getTutorialLessons,
    getTutorialResources,
    saveTutorial,
    getSavedTutorials,
    submitReview,
    getReviews,
    getMyEnrolledTutorials,
    unsaveTutorial,
    enrollTutorial,
    unenrollTutorial,
    getAllTutorials,
    getLessonById,
    getResourceById,
    getTutorialById,
    addCompletedLesson,
    getCompletedLessons,
    getQuizByTutorialId,
    submitQuizAnswers,
    getScores,
    getScoreByQuizId,
    getAllFaqs,
    getFaqById,
    getFaqsByTutorial,
    checkEnrollment
} = require("../controllers/studentController");

const { authenticate, authorization } = require("../middlewares/authMiddleware");

// Middleware d'authentification
router.use(authenticate);
router.use(authorization("student"));

/**
 * Profile et Auth
 */
router.patch("/update-profile", updateProfile); // Update profile
router.post("/logout", logout); // Logout

/**
 * Tutoriels
 */
router.get("/tutorials", getAllTutorials); // Get all tutorials
router.get("/tutorials/:id/lessons", getTutorialLessons); // Get lessons for a tutorial
router.get("/tutorials/:id/resources", getTutorialResources); // Get resources for a tutorial
router.get("/tutorials/:tutorialId", getTutorialById); // Get tutorial by id

/**
 * Leçons et Vidéos
 */
router.get("/lessons/:lessonId", getLessonById); // Get lesson by id
router.get("/resources/:resourceId", getResourceById); // Get resource by id

/**
 * Sauvegarder un tutoriel
 */
router.post("/tutorials/:tutorialId/save", saveTutorial); // Save a tutorial
router.delete("/tutorials/:tutorialId/unsave", unsaveTutorial); // Unsave a tutorial
router.get("/saved-tutorials", getSavedTutorials); // Get saved tutorials

/**
 * Avis et évaluations
 */
router.get("/tutorials/:tutorialId/reviews", getReviews); // Get all reviews for student
router.post("/tutorials/:tutorialId/reviews", submitReview); // Submit review for a tutorial

/**
 * Inscription / désinscription à un tutoriel
 */
router.post("/tutorials/:tutorialId/enroll", enrollTutorial); // Enroll in a tutorial
router.delete("/tutorials/:tutorialId/unenroll", unenrollTutorial); // Unenroll from a tutorial
router.get("/enrolled-tutorials", getMyEnrolledTutorials); // Get enrolled tutorials

/**
 * Completed Lessons
 */
router.post("/completed/:tutorialId/:lessonId", addCompletedLesson); // Mark lesson as completed
router.get("/completed/:tutorialId", getCompletedLessons); // Get all completed lessons for student with tutorialId

/**
 * Quiz
 */
router.get("/quizzes/:tutorialId", getQuizByTutorialId); // Get quiz for a tutorial
router.post("/quizzes/:tutorialId/submit", submitQuizAnswers); // Submit quiz answers

/**
 * Score
 */
router.get("/scores", getScores); // Get all scores for student
router.get("/scores/:quizId", getScoreByQuizId); // Get score for a specific quiz

/**
 * FAQ
 */
router.get("/faqs", getAllFaqs); // Get all FAQs
router.get("/faqs/:id", getFaqById); // Get FAQ by id
router.get("/tutorials/:tutorialId/faqs", getFaqsByTutorial); // Get FAQs

router.get("/is-enrolled/:tutorialId",checkEnrollment)
router.post('/stripe/create-checkout-session/:courseId', StripePayment)

module.exports = router;
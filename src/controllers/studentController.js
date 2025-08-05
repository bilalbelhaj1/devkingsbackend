const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const Tutorial = require("../models/Tutorial");
const Lesson = require("../models/Lesson");
const Review = require("../models/Review");
const Enrolled = require("../models/Enrolled");
const Resource = require("../models/Resource");
const SavedTutorial = require("../models/SavedTutorial");
const Faq = require("../models/Faq");
const stripe = require('stripe')(process.env.STRIPE_KEY)

// 1. Update Profile
const updateProfile = async (req, res) => {
    const {
        body: { firstName, lastName, email },
        user: { userId }
    } = req
    if (!firstName || !lastName || !email) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please provide first name, last name and email" })
    }

    const user = await User.findOneAndUpdate({ _id: userId }, req.body, {
        new: true,
        runValidators: true
    })

    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No user with id : ${userId}` })
    }

    res.status(StatusCodes.OK).json({
        message: "Profile updated successfully", user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        }
    })

}

// 2. Logout
const logout = async (req, res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(StatusCodes.OK).json({ message: "Logout successful" });
}

// 3. Get all lessons for a tutorial
const getTutorialLessons = async (req, res) => {
    const { id } = req.params;
    const tutorial = await Tutorial.findById(id);
    if (!tutorial) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No tutorial found with id ${id}` })
    }
    const lessons = await Lesson.find({ tutorialId: id }).sort('createdAt').populate('resources');
    res.status(StatusCodes.OK).json({ lessons });
}

// 3b. Get a single lesson by id
const getLessonById = async (req, res) => {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId).populate('resources');
    if (!lesson) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No lesson found with id ${lessonId}` })
    }

    const lessons = await Lesson.find({ tutorialId: lesson.tutorialId }).sort('createdAt')
    const idx = lessons.findIndex(l => l._id.toString() === lessonId)
    const prevLesson = idx > 0 ? lessons[idx - 1] : null
    const nextLesson = idx < lessons.length - 1 ? lessons[idx + 1] : null

    res.status(StatusCodes.OK).json({ lesson, prevLesson, nextLesson });
}

// 3c. Get a single resource by id
const getResourceById = async (req, res) => {
    const { resourceId } = req.params;
    const resource = await Resource.findById(resourceId);
    if (!resource) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No resource found with id ${resourceId}` })
    }
    res.status(StatusCodes.OK).json({ resource });
}

// 4. Get all resource IDs for a tutorial (from all lessons)
const getTutorialResources = async (req, res) => {
    const { id } = req.params;
    const resources = await Lesson.find({ tutorialId: id }).select('resources').populate('resources');
    const finalResources = [].concat(...resources.map(resource => resource.resources))
    res.status(StatusCodes.OK).json({ resources: finalResources });
}

// 5. Save tutorial
const saveTutorial = async (req, res) => {
    const { tutorialId } = req.params;
    const { userId } = req.user;

    const savedTutorial = await SavedTutorial.findOne({ studentId: userId, tutorialId: tutorialId });

    if (savedTutorial) {
        return res.status(StatusCodes.OK).json({ message: "Tutorial already saved" });
    }

    const newSavedTutorial = new SavedTutorial({
        studentId: userId,
        tutorialId: tutorialId
    })

    await newSavedTutorial.save();

    res.status(StatusCodes.OK).json({ message: "Tutorial saved successfully" });
}

// 6. Get saved tutorials
const getSavedTutorials = async (req, res) => {
    const { userId } = req.user;
    const savedTutorials = await SavedTutorial.find({ studentId: userId }).populate('tutorialId', 'title description thumbnail');

    if (!savedTutorials) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No saved tutorials found for user with id : ${userId}` })
    }

    res.status(StatusCodes.OK).json({ count: savedTutorials.length, savedTutorials });
}

// 7. Submit review & rating
const submitReview = async (req, res) => {

    const { tutorialId } = req.params;
    const { userId } = req.user;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please provide rating and comment" });
    }

    const review = await Review.findOne({ studentId: userId, tutorialId: tutorialId });

    if (review) {
        return res.status(StatusCodes.OK).json({ message: "Review already submitted" });
    }

    const newReview = new Review({
        studentId: userId,
        tutorialId: tutorialId,
        rating,
        comment
    })

    await newReview.save();

    res.status(StatusCodes.OK).json({ message: "Review submitted successfully" });
}

// 8. Get enrolled tutorials
const getMyEnrolledTutorials = async (req, res) => {
    const { userId } = req.user;
    const enrolledTutorials = await Enrolled.find({ studentId: userId }).populate('tutorialId').populate({
        path: 'tutorialId',
        populate: {
          path: 'faqs',
          model: 'Faq'
        }
      }).lean();
    
    const reviews = await Review.find({ studentId: userId }).populate('tutorialId').lean();

    if (!enrolledTutorials) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No enrolled tutorials found for user with id : ${userId}` })
    }

    res.status(StatusCodes.OK).json({ count: enrolledTutorials.length, enrolledTutorials, reviews });
}

// 9. Unsave tutorial
const unsaveTutorial = async (req, res) => {
    const { tutorialId } = req.params;
    const { userId } = req.user;

    const savedTutorial = await SavedTutorial.findOne({ studentId: userId, tutorialId });

    if (!savedTutorial) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No saved tutorial found for user with id : ${userId}` });
    }

    await savedTutorial.deleteOne();

    res.status(StatusCodes.OK).json({ message: "Tutorial unsaved successfully" });
}

// 10. Enroll an tutorial
const enrollTutorial = async (req, res) => {
    const { tutorialId } = req.params;
    const { userId } = req.user;
    console.log(tutorialId)
    console.log(userId)
    const enrolledTutorial = await Enrolled.findOne({ userId, tutorialId });
    console.log(enrolledTutorial)
    if (enrolledTutorial) {
        return res.status(StatusCodes.OK).json({ message: "Tutorial already enrolled" });
    }

    const newEnrolledTutorial = new Enrolled({
        studentId: userId,
        tutorialId: tutorialId
    })

    await newEnrolledTutorial.save();

    res.status(StatusCodes.OK).json({ message: "Tutorial enrolled successfully" });
}

// 11. Unenroll an tutorial
const unenrollTutorial = async (req, res) => {
    const { tutorialId } = req.params;
    const { userId } = req.user;

    const enrolledTutorial = await Enrolled.findOne({ studentId: userId, tutorialId });

    if (!enrolledTutorial) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No enrolled tutorial found for user with id : ${userId}` })
    }

    await enrolledTutorial.deleteOne();

    res.status(StatusCodes.OK).json({ message: "Tutorial unenrolled successfully" });
}

// 12. Get all tutorials
const getAllTutorials = async (req, res) => {
    const { category } = req.query;
    const query = {};
    if (category) {
        query.category = category;
    }

    // Use populate to get teacher and lessons data in one query
    const tutorials = await Tutorial.find(query)
        .populate('teacherId', 'firstName lastName')
        .populate('lessons', 'title')
        .populate('resources', 'title')
        .populate('faqs', 'question answer')
        .lean();

    res.status(StatusCodes.OK).json({
        count: tutorials.length,
        tutorials
    });
}

// 13. Get tutorial by id
const getTutorialById = async (req, res) => {
    const { tutorialId } = req.params;
    const tutorial = await Tutorial.findById(tutorialId)
        .populate('teacherId', 'firstName lastName profile avatar')
        .populate('lessons', 'title description videoUrl')
        .populate('resources', 'title path')
        .populate('faqs', 'question answer')
        .lean();
    if (!tutorial) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No tutorial found with id ${tutorialId}` })
    }
    const enrolledCount = await Enrolled.countDocuments({tutorialId})
    res.status(StatusCodes.OK).json({ tutorial: {...tutorial, enrolledCount} });
}

const Completed = require("../models/Completed");
const Quiz = require("../models/Quiz");
const Score = require("../models/Score");

// 14. Add Completed Lesson
const addCompletedLesson = async (req, res) => {
    const { lessonId, tutorialId } = req.params;
    const { userId } = req.user;
    if (!lessonId || !tutorialId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please provide lessonId and tutorialId" });
    }
    const exists = await Completed.findOne({ studentId: userId, lessonId: lessonId, tutorialId });
    if (exists) {
        return res.status(StatusCodes.OK).json({ message: "Lesson already marked as completed" });
    }
    const completed = await Completed.create({ studentId: userId, lessonId, tutorialId });
    res.status(StatusCodes.CREATED).json({ completed });
};

// 15. Get Completed Lessons
const getCompletedLessons = async (req, res) => {
    const { tutorialId } = req.params;
    const { userId } = req.user;
    const completed = await Completed.find({ studentId: userId, tutorialId });
    res.status(StatusCodes.OK).json({ completed });
};

// 16. Get Quiz by Tutorial
const getQuizByTutorialId = async (req, res) => {
    const { tutorialId } = req.params;
    const quiz = await Quiz.findOne({ tutorialId });
    const teacher = await Tutorial.findById(tutorialId).select('teacherId').populate('teacherId', 'firstName lastName');
    if (!quiz) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No quiz found for tutorial ${tutorialId}` });
    }
    res.status(StatusCodes.OK).json({ quiz, teacher: teacher.teacherId.firstName + ' ' + teacher.teacherId.lastName });
};

// 17. Submit Quiz Answers
const submitQuizAnswers = async (req, res) => {
    const { tutorialId } = req.params;
    const { answers } = req.body;
    const { userId } = req.user;
    if (!answers || !Array.isArray(answers)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please provide answers array" });
    }
    const quiz = await Quiz.findOne({ tutorialId });
    if (!quiz) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No quiz found for tutorial ${tutorialId}` });
    }
    let scoreValue = 0;
    quiz.questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) scoreValue++;
    });
    // Save the score value in Score model
    await Score.create({ studentId: userId, quizId: quiz._id, tutorialId, score: scoreValue });
    res.status(StatusCodes.OK).json({ message: "Quiz submitted", score: scoreValue, totalQuestions: quiz.questions.length });
};

// 18. Get Scores
const getScores = async (req, res) => {
    const { userId } = req.user;
    const scores = await Score.find({ studentId: userId });
    res.status(StatusCodes.OK).json({ scores });
};

// 19. Get Score by Quiz
const getScoreByQuizId = async (req, res) => {
    const { userId } = req.user;
    const { quizId } = req.params;
    const score = await Score.findOne({ studentId: userId, quizId });
    if (!score) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No score found for this quiz` });
    }
    res.status(StatusCodes.OK).json({ score });
};

// 21. Get All FAQs
const getAllFaqs = async (req, res) => {
    const faqs = await Faq.find();
    res.status(StatusCodes.OK).json({ faqs });
};

// 22. Get FAQ by ID
const getFaqById = async (req, res) => {
    const { id } = req.params;
    const faq = await Faq.findById(id);
    if (!faq) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: `No FAQ found with id ${id}` });
    }
    res.status(StatusCodes.OK).json({ faq });
};

// 25. Get FAQs by Tutoria
const getFaqsByTutorial = async (req, res) => {
    const { tutorialId } = req.params;
    const faqs = await Faq.find({ tutorialId });
    res.status(StatusCodes.OK).json({ faqs });
};

// 26. Get Reviews by Tutorial
const getReviews = async (req, res) => {
    const { tutorialId } = req.params;
    const reviews = await Review.find({ tutorialId });
    res.status(StatusCodes.OK).json({ reviews });
};

const mongoose = require('mongoose');

const checkEnrollment = async (req, res) => {
  const { tutorialId } = req.params;
  const userId = req.user.userId;

  console.log("tutorialId:", tutorialId);
  console.log("userId:", userId);

  const enrolledTutorial = await Enrolled.findOne({
    studentId: new mongoose.Types.ObjectId(userId),
    tutorialId: new mongoose.Types.ObjectId(tutorialId)
  });

  console.log("Matched enrollment:", enrolledTutorial);

  res.status(200).json({ enrolled: !!enrolledTutorial });
};

const StripePayment = async (req, res)=>{
    const  courseId = req.params.courseId;
    const userId = req.user.userId;
    console.log(courseId)
    try {
    const course = await Tutorial.findById(courseId);
    console.log(course)
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const YOUR_DOMAIN = 'https://devkingfrontend.vercel.app'; 

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description
          },
          unit_amount: course.price * 100,
        },
        quantity: 1,
      }],
      metadata: {
        courseId,
        userId
      },
      success_url: `${YOUR_DOMAIN}/payment-success/${courseId}`,
      cancel_url: `${YOUR_DOMAIN}/course_enroll`,
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
}

module.exports = {
    StripePayment,
    checkEnrollment,
    updateProfile,
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
    getFaqsByTutorial
};
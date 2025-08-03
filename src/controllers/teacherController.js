const Cours = require('../models/Tutorial');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource');
const Completed = require('../models/Completed')
const Faq = require('../models/Faq');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const createResources = require('../utils/createRessources');
const { getTeacherTutorialIds } = require("../utils/teacherUtils");
const Enrolled = require('../models/Enrolled');
const Review = require('../models/Review');
const { getDateRange } = require('../utils/getDateAvergae')

// get teacher Profile
const teacherHome = async (req, res) => {
    const teacherId = req.user.userId;

    const teacher = await User.findById(teacherId).select("-password");
    const allCourses = await Cours.find({ teacherId });

    const enrichedCourses = [];

    for (const course of allCourses) {
        const enrolled = await Enrolled.find({ tutorialId: course._id });
        const studentCount = enrolled.length;

        const reviews = await Review.find({ tutorialId: course._id });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        enrichedCourses.push({
            course,
            studentCount,
            avgRating,
            reviewCount: reviews.length
        });
    }

    const topCourses = enrichedCourses
        .sort((a, b) => b.avgRating - a.avgRating) 
        .slice(0, 5); 

    const topReviews = await Review.find({ tutorialId: { $in: allCourses.map(c => c._id) } })
        .sort({ rating: -1, createdAt: -1 })
        .limit(5)
        .populate("studentId", "firstName lastName");

    const totalStudents = enrichedCourses.reduce((sum, c) => sum + c.studentCount, 0);

    res.status(200).json({
        teacher,
        totalStudents,
        topCourses,
        topReviews
    });
};
/* 
const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    console.log(req.body)
    const { firstName, lastName, profile, bio } = req.body;
    console.log(req.body)
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (profile) user.profile = profile;
    if (bio !== undefined) user.bio = bio;

    if (req.file) {
      user.profilePic = `uploads/images/${req.file.filename}`;
    }

    await user.save();

    const cleanUser = user.toObject();
    delete cleanUser.password;

    res.status(200).json(cleanUser);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};
 */

// add new Course
const AddCourse = async (req, res) => {
    const { title, description, category, benefits, prerequisites, price, resources} = req.body;
    const toSaveBenefets = typeof benefits === "string" ? JSON.parse(benefits) : benefits;

    const toSvePrerequisites = typeof prerequisites === "string" ? JSON.parse(prerequisites) : prerequisites;

    const thumbnail = req.file ? `uploads/images/${req.file.filename}` : null;
    console.log(thumbnail)
    if(!thumbnail){
        return res.status(401).json({
            message:"Please provide a thumbnail for your course"
        })
    }
    const teacherId = req.user.userId;
    console.log(description)
    if(!title || !description || !category || !price || !teacherId){
        return res.status(400).json({
            message: "Please fill all the fields"
        })
    }
    const resourcesIds = await createResources(resources)
    const newCours = new Cours({
        teacherId,
        title,
        description,
        category,
        price,
        thumbnail,
        resources:resourcesIds,
        benefits:toSaveBenefets,
        prerequisites:toSvePrerequisites
    })
    try{
        await newCours.save();
        res.status(201).json({newCours})
    }catch(err){
        console.error(err);
        res.status(500).json({
            message:'Internal server Error'
        })
    }
}

// get all teacher courses
const getAllCourses = async (req, res)=>{
    const teacherId = req.user.userId;
    if(!teacherId){
        res.status(400).json({
            message:"Could not Load your Courses"
        })
    }else{
        let coursesData = [];
        const courses =  await Cours.find({teacherId});
        console.log(courses);
        for (const course of courses){
            const enrolled = await Enrolled.find({tutorialId:course._id});
            const studentsCount = enrolled.length;

            const reviews = await Review.find({tutorialId: course._id});
            const totalRating = reviews.reduce((sum, r)=>sum + r.rating,0);
            const avgRating = reviews.length > 0 ? totalRating / reviews.length :0;
            coursesData.push({
                id:course._id,
                image:course.thumbnail,
                title:course.title,
                category:course.category,
                lessons:course.lessons.length,
                students:studentsCount
            })
        }
        res.status(200).json(coursesData);
    }
}

// get a sepesific course
const getCourse = async (req, res) => {
    const courseId = req.params.courseId;

    if (!courseId) {
        return res.status(400).json({
            message: "Could not load the course"
        });
    }

    try {
        
        const course = await Cours.findById(courseId)
            .populate({
                path: 'lessons',
            })
            .populate('faqs')
            .populate('resources')

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        
        const enrolled = await Enrolled.find({ tutorialId: course._id });
        const studentsCount = enrolled.length;

        
        const reviews = await Review.find({ tutorialId: course._id })
            .populate({
                path: 'studentId',
                select: 'firstName lastName profilePic'
            });

        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        
        res.status(200).json({
            course,
            studentsCount,
            avgRating,
            reviewsCount: reviews.length,
            reviews
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


// delete course
const deleteCourse = async (req, res)=>{
    const courseId =  req.params.courseId;
    if(!courseId){
        return res.status(400).json({
            message:"Could not delete this Course"
        })
    }
    try{
        const deletedCourse = await Cours.findByIdAndDelete(courseId);
        await Lesson.deleteMany({tutorialId:courseId});
        await Faq.deleteMany({tutorialId:courseId});
        await Resource.deleteMany({_id:{$in:deletedCourse.resources}});
         res.status(201).json({
            message:"course Deleted",
        })
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

// update course
const updateCourse = async (req, res)=>{
    const { title, description, category,price, benefits, prerequisites, resources } = req.body;
    const courseId =  req.params.courseId;
    if(!courseId){
        return res.status(400).json({
            message:"Could not Update the Cours"
        })
    }
    try{
        const updatedFields = {};
        if(title) updatedFields.title = title;
        if(description) updatedFields.description = description;
        if(category) updatedFields.category = category;
        if(price) updatedFields.price = price;
        if(benefits) updatedFields.benefits = benefits;
        if(prerequisites) updatedFields.prerequisites = prerequisites;
        if(req.file) updatedFields.thumbnail = req.file ? `uploads/images/${req.file.filename}` : null;
        if(resources) updatedFields.resources = await createResources(resources)
        const updatedCours = await Cours.findByIdAndUpdate(
            courseId,
            {$set:updatedFields},
            {new:true}
        )
        res.status(201).json(updatedCours);
    }catch(err){
        console.log(err);
        res.status(500).json({
            message:"Internale Server Error"
        })
    }
}

// add lesson to a course
const addLesson = async (req, res)=>{
    const courseId = req.params.courseId;
    const {title, description, resources} = req.body;
    if(!courseId){
        return res.status(401).json({
            message:"Something went wrong Try again"
        })
    }
    console.log(req.body);
    if(!title || !description){
        return res.status(401).json({
            message:"Please provide all fieldssss"
        })
    }
    let parsedResources;
    try {
        parsedResources = typeof resources === "string" ? JSON.parse(resources) : resources;
    } catch (err) {
        return res.status(400).json({ message: "Invalid resources format" });
    }
    try{
        const videoPath = req.file ? `uploads/videos/${req.file.filename}` : null;
        if(!videoPath){
            return res.status(404).json({
                message:"Please provide a video tutorial for this lesson"
            })
        }
        const ressourceIds = await createResources(parsedResources);

        const newLesson = new Lesson({
        title, 
        description,
        videoUrl:videoPath,
        tutorialId:courseId,
        resources:ressourceIds
    })
    const savedLesson = await newLesson.save();
    await Cours.findByIdAndUpdate(courseId, {$push : {lessons:newLesson._id}})
    res.status(201).json(savedLesson);
    }catch(err){
        console.log(err);
        res.status(500).json({
            message:"Internale Server Error"
        })
    }
}

// get all lessons of a cours
const getAllLessons = async (req, res)=>{
    const courseId = req.params.courseId;
    if(!courseId){
        return res.status(400).json({
            message:"could not load the course"
        })
    }

    try{
        const lessons = await Lesson.find({tutorialId:courseId}).populate('resources');
        res.status(200).json(lessons)
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

// delete lesson
const deleteLesson = async (req, res)=>{
    const lessonId =  req.params.lessonId;
    if(!lessonId){
        return res.status(400).json({
            message:"Could not delete this Lesson"
        })
    }
    try{
        const deletedLesson = await Lesson.findByIdAndDelete(lessonId);
        await Resource.deleteMany({_id:{$in:deletedLesson.resources}});
        await Cours.findByIdAndUpdate(deletedLesson.tutorialId, {
            $pull: { lessons: lessonId }
        });
        res.status(201).json({
            message:"Lesson Deleted",
        })
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

// get a spesific lesson
const getLesson = async (req, res)=>{
    const lessonId = req.params.lessonId;
    if(!lessonId){
        return res.status(400).json({
            message:"Could not load the lesson"
        })
    }
    try{
        const lesson = await Lesson.findById(lessonId).populate('resources');
        res.status(200).json(lesson);
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

// update lesson
const updateLesson = async (req, res)=>{
    const {title, description, resources} = req.body;
    const lessonId = req.params.lessonId;
    if(!lessonId){
        return res.status(400).json({
            message:"Could  not update this lesson"
        })
    }
    let resourceIds
    if(resources){
        resourceIds = await createResources(resources)
    }
    try{
        let updatedFields = {};
        if(title) updatedFields.title = title;
        if(description) updatedFields.description = description;
        if(req.file) updatedFields.videoUrl = req.file ? `uploads/videos/${req.file.filename}` : null;
        if(resources) updatedFields.resources = resourceIds;
        const updatedLesson = await Lesson.findByIdAndUpdate(lessonId,{
            $set:updatedFields,
        },{new:true});
        res.status(201).json(updatedLesson);

    }catch(err){
        res.status(500).json({
            message:"Internale  Server Error"
        })
    }
}

// add resource to lesson
const addResourceToLesson = async (req, res) => {
    const lessonId = req.params.lessonId;
    if(!lessonId){
        return res.status(400).json({
            message:"Could not add resource to this lesson"
        })
    }
    const { resources } = req.body;
    let parsedResources
    try{
        parsedResources = typeof resources === "string"?JSON.parse(resources):resources
    }catch(err){
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
    if(!parsedResources || parsedResources.length === 0){
        return res.status(400).json({
            message:"Please provide resources to add"
        })
    }
    const resourceIds = await createResources(parsedResources);
    try{
        await Lesson.findByIdAndUpdate(lessonId, {
            $push: { resources: { $each: resourceIds } }
        });
        res.status(201).json({ message: "Resources added to lesson" });
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

// add resource to course
const addResourceToCourse = async (req, res) => {
    const courseId = req.params.courseId;
    if(!courseId){
        return res.status(400).json({
            message:"Could not add resource to this course"
        })
    }
    const { resources } = req.body;
    let parsedResources
    try{
        parsedResources = typeof resources === "string"?JSON.parse(resources):resources
    }catch(err){
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
    if(!parsedResources || parsedResources.length === 0){
        return res.status(400).json({
            message:"Please provide resources to add"
        })
    }
    const resourceIds = await createResources(parsedResources);
    try{
        await Cours.findByIdAndUpdate(courseId, {
            $push: { resources: { $each: resourceIds } }
        });
        res.status(201).json({ message: "Resources added to course" });
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}
// delete resource from lesson
const deleteResourceFromLesson = async (req, res) => {
    const lessonId = req.params.lessonId;
    const resourceId = req.body.resourceId;
    if(!lessonId || !resourceId){
        return res.status(400).json({
            message:"Could not delete resource from this lesson"
        })
    }
    try{
        await Lesson.findByIdAndUpdate(lessonId, {
            $pull: { resources: resourceId }
        });
        await Resource.findByIdAndDelete(resourceId);
        res.status(201).json({ message: "Resource deleted from lesson" });
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}
// delete resource from course
const deleteResourceFromCourse = async (req, res) => {
    const courseId = req.params.courseId;
    const resourceId = req.body.resourceId;
    if(!courseId || !resourceId){
        return res.status(400).json({
            message:"Could not delete resource from this course"
        })
    }
    try{
        await Cours.findByIdAndUpdate(courseId, {
            $pull: { resources: resourceId }
        });
        await Resource.findByIdAndDelete(resourceId);
        res.status(201).json({ message: "Resource deleted from course" });
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

// create FAQ for a course
const createFaq = async (req, res) => {
    const { courseId } = req.params;
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: "Please provide question and answer" });
    }
    const faq = await Faq.create({ tutorialId:courseId, question, answer });
    await Cours.findByIdAndUpdate(courseId, {
        $push : {faqs : faq._id}
    })
    res.status(201).json({ faq });
};

// update FAQ
const updateFaq = async (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: "Please provide question and answer" });
    }
    const faq = await Faq.findByIdAndUpdate(id, { question, answer });
    if (!faq) {
        return res.status(404).json({ message: `No FAQ found with id ${id}` });
    }
    const newFaq = await Faq.findById(id);
    res.status(201).json({ faq : newFaq });
};
// delete FAQ
const deleteFaq = async (req, res) => {
    const { id } = req.params;
    const faq = await Faq.findOne({ _id: id });
    if (!faq) {
        return res.status(404).json({ message: `No FAQ found with id ${id}` });
    }
    await faq.deleteOne();
    await Cours.findByIdAndUpdate(faq.tutorialId, {
        $pull : {faqs: id}
    })
    res.status(200).json({ message: "FAQ deleted successfully" });
};

const createQuiz = async (req, res) => {
    const courseId = req.params.courseId;
    if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
    }

    try {
        const { questions } = req.body;
        const parsedQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;

        const newQuiz = new Quiz({
            tutorialId: courseId,
            questions: parsedQuestions,
        });

        await newQuiz.save();
        res.status(201).json(newQuiz);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getQuiz = async (req, res)=>{
    const courseId = req.params.courseId;
    if(!courseId){
        return res.status(401).json({
            message:"Something went wrong could not load the quiz"
        })
    }
    try{
        const quiz = await Quiz.find({tutorialId:courseId});
        res.status(200).json(quiz)
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

const addQuestionToQuiz = async (req, res)=>{
    const quizId = req.params.quizId;
    if(!quizId){
        return res.status(401).json({
            message:"something went wrong could not add question to the Quiz"
        })
    }
    try{
        const {questions} = req.body;
        const parsedQuestions = typeof questions === "string"?JSON.parse(questions):questions;
        const quiz = await Quiz.findByIdAndUpdate(
            quizId,
            { $push: { questions: parsedQuestions } },
            { new: true }
        );

        res.status(201).json(quiz);
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

const updateQuiz = async (req, res)=>{
    const quizId = req.params.quizId;
    try{
        const { questions } = req.body;
        const parsedQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;
        const newQuiz = await Quiz.findByIdAndUpdate(quizId,{
            questions:parsedQuestions
        })
        res.status(200).json(newQuiz)
    }catch(err){
        console.log(err);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }

}

// 1. Overview
const getOverviewStats = async (req, res) => {
  const teacherId = req.user.userId;
  const { start, end } = getDateRange(req.query.period || 'month');

  const tutorialIds = await getTeacherTutorialIds(teacherId);

  const [lessons, enrollments, completions] = await Promise.all([
    Lesson.find({ tutorialId: { $in: tutorialIds }, createdAt: { $gte: start, $lte: end } }),
    Enrolled.find({ tutorialId: { $in: tutorialIds }, createdAt: { $gte: start, $lte: end } }).populate('tutorialId', 'price'),
    Completed.find({ tutorialId: { $in: tutorialIds }, createdAt: { $gte: start, $lte: end } })
  ]);

  const revenue = enrollments.reduce((sum, e) => sum + (e.tutorialId?.price || 0), 0);
  const activeUserIds = new Set([
    ...enrollments.map(e => e.studentId.toString()),
    ...completions.map(c => c.studentId.toString())
  ]);

  res.json({
    revenue,
    coursesCreated: tutorialIds.length,
    lessonsCreated: lessons.length,
    activeUsers: activeUserIds.size
  });
};

// 2. Sales Performance
const getSalesPerformance = async (req, res) => {
  const teacherId = req.user.userId;
  const { start, end } = getDateRange(req.query.period || 'month');

  const tutorialIds = await getTeacherTutorialIds(teacherId);

  const data = await Enrolled.aggregate([
    {
      $match: {
        tutorialId: { $in: tutorialIds },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          day: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
  ]);

  res.json(data);
};

// 3. Enrollment vs Completion
const getEnrollmentVsCompletion = async (req, res) => {
  const teacherId = req.user.userId;
  const { start, end } = getDateRange(req.query.period || 'month');

  const tutorials = await Cours.find({ teacherId }).select("_id title");

  const result = await Promise.all(
    tutorials.map(async (tutorial) => {
      const [enrollments, completionsData] = await Promise.all([
        Enrolled.countDocuments({
          tutorialId: tutorial._id,
          createdAt: { $gte: start, $lte: end },
        }),
        Completed.aggregate([
          {
            $match: {
              tutorialId: tutorial._id,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              totalCompleted: { $sum: 1 },
            },
          },
        ])
      ]);

      const completions = completionsData[0]?.totalCompleted || 0;

      return {
        title: tutorial.title,
        enrollments,
        completions,
      };
    })
  );

  res.json(result);
};
// 4. Recent Transactions
const getRecentTransactions = async (req, res) => {
  const teacherId = req.user.userId;
  const tutorialIds = await getTeacherTutorialIds(teacherId);

  const recent = await Enrolled.find({ tutorialId: { $in: tutorialIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('studentId', 'firstName lastName profilePic')
    .populate('tutorialId', 'title');

  res.json(recent);
};

// 5. Top Learners
const getTopLearners = async (req, res) => {
  const teacherId = req.user.userId;
  const { start, end } = getDateRange('month');

  const tutorialIds = await getTeacherTutorialIds(teacherId);

  const data = await Completed.aggregate([
    {
      $match: {
        tutorialId: { $in: tutorialIds },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$studentId",
        totalLessons: { $sum: 1 }
      }
    },
    { $sort: { totalLessons: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        name: { $concat: ["$student.firstName", " ", "$student.lastName"] },
        profilePic: "$student.profilePic",
        totalLessons: 1
      }
    }
  ]);

  res.json(data);
};

const getTopCourses = async (req, res) => {
  const teacherId = req.userId;
  const { start, end } = getDateRange(req.query.period || 'month');

  const tutorialIds = await getTeacherTutorialIds(teacherId);

  const data = await Enrolled.aggregate([
    {
      $match: {
        tutorialId: { $in: tutorialIds },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$tutorialId",
        enrollments: { $sum: 1 }
      }
    },
    { $sort: { enrollments: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "tutorials", // your collection name in MongoDB
        localField: "_id",
        foreignField: "_id",
        as: "tutorial"
      }
    },
    { $unwind: "$tutorial" },
    {
      $project: {
        title: "$tutorial.title",
        enrollments: 1
      }
    }
  ]);

  res.json(data);
};

// Exporting all functions
module.exports = {
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
}
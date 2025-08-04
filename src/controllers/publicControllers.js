const Course = require('../models/Tutorial');
const Review = require('../models/Review');
const User = require('../models/User');
const Faq = require('../models/Faq');
const Lesson = require('../models/Lesson');
const Enrolled = require('../models/Enrolled');

// get Top courses
const getTopCourses = async (req, res) => {
    try {
        const { category } = req.query;

        const pipeline = [
            {
                $group: {
                    _id: "$tutorialId",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            },
            { $sort: { averageRating: -1, reviewCount: -1 } },
            {
                $lookup: {
                    from: "tutorials",
                    localField: "_id",
                    foreignField: "_id",
                    as: "tutorial"
                }
            },
            { $unwind: "$tutorial" }
        ];

        // category filter
        if (category) {
            pipeline.push({
                $match: {
                    "tutorial.category": category
                }
            });
        }

        pipeline.push(
            { $limit: 6 },
            {
                $lookup: {
                    from: "users",
                    localField: "tutorial.teacherId",
                    foreignField: "_id",
                    as: "teacher"
                }
            },
            { $unwind: "$teacher" },
            {
                $project: {
                    _id: "$tutorial._id",
                    title: "$tutorial.title",
                    thumbnail: "$tutorial.thumbnail",
                    description: "$tutorial.description",
                    price:"$tutorial.price",
                    category: "$tutorial.category",
                    averageRating: 1,
                    reviewCount: 1,
                    teacherId: "$teacher._id",
                    teacherName: {
                        $concat: ["$teacher.firstName", " ", "$teacher.lastName"]
                    },
                }
            }
        );

        const topCourses = await Review.aggregate(pipeline);

        res.status(200).json(topCourses);
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// get teachers
const getTeachers = async (req, res) => {
    try {
        const { category } = req.query;

        const tutorialMatch = category ? { category } : {};

        const teacherIds = await Course.distinct("teacherId", tutorialMatch);

        // Step 3: Build query
        const userQuery = {
            role: "teacher",
            ...(category && { _id: { $in: teacherIds } })
        };

        const teachers = await User.find(userQuery)
            .select("firstName lastName profile profilePic") 
            .lean();
        const courseCounts = await Course.aggregate([
            {
                $match: category ? { category } : {}
            },
            {
                $group: {
                    _id: "$teacherId",
                    courseCount: { $sum: 1 }
                }
            }
        ]);

        // Map course counts to teachers
        const teacherCourseMap = {};
        courseCounts.forEach(item => {
            teacherCourseMap[item._id.toString()] = item.courseCount;
        });

        const result = teachers.map(t => ({
            teacherId: t._id,
            fullName: `${t.firstName} ${t.lastName}`,
            profile: t.profile || "",
            profilePic: t.profilePic || "",
            totalCourses: teacherCourseMap[t._id.toString()] || 0
        }));

        res.status(200).json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// get and filter all courses 
const getAllCourses = async (req, res) => {
    try {
        const { search, category } = req.query;
        console.log(category);
        const matchConditions = [];

        if (category) {
            matchConditions.push({ category });
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');

            
            const matchingTeachers = await User.find({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex }
                ]
            }, '_id');
            const teacherIds = matchingTeachers.map(user => user._id);

            matchConditions.push({
                $or: [
                    { title: searchRegex },
                    { teacherId: { $in: teacherIds } }
                ]
            });
        }

        const matchStage = matchConditions.length ? { $match: { $and: matchConditions } } : { $match: {} };

        const courses = await Course.aggregate([
            matchStage,
            {
                $lookup: {
                    from: 'users',
                    localField: 'teacherId',
                    foreignField: '_id',
                    as: 'teacherInfo'
                }
            },
            { $unwind: '$teacherInfo' },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'tutorialId',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: '$reviews.rating' },
                    reviewCount: { $size: '$reviews' }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    price: 1,
                    category: 1,
                    thumbnail: 1,
                    description: 1,
                    averageRating: { $ifNull: ['$averageRating', 0] },
                    reviewCount: 1,
                    teacher: {
                        _id: '$teacherInfo._id',
                        teacherProfile:'$teacherInfo.profile',
                        fullName: {
                        $concat: ['$teacherInfo.firstName', ' ', '$teacherInfo.lastName']
                        },
                        profilePic: '$teacherInfo.profilePic'
                    }
                }
            }
        ]);

        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// get all the details about the course
const getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;
        console.log(courseId)
        const course = await Course.findById(courseId)
            .populate({
                path: 'teacherId',
                select: 'firstName lastName profile profilePic'
            })
            .lean();
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        let lessons = [];
        if (course.lessons && course.lessons.length > 0) {
            const lessonDocs = await Lesson.find({ _id: { $in: course.lessons } }).select('title');
            lessons = lessonDocs.map(lesson => ({ _id: lesson._id, title: lesson.title }));
        }

        const faqs = await Faq.find({ tutorialId: courseId })
            .select('question answer')
            .lean();

        const reviews = await Review.find({ tutorialId: courseId })
            .populate({
                path: 'studentId',
                select: 'firstName lastName profilePic'
            })
            .lean();

        const formattedReviews = reviews.map(review => ({
            rating: review.rating,
            comment: review.comment,
            fullName: `${review.studentId.firstName} ${review.studentId.lastName}`,
            profilePic: review.studentId.profilePic
        }));

        const averageRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        const totalEnrolled = await Enrolled.countDocuments({ tutorialId: courseId });

        const response = {
            _id: course._id,
            title: course.title,
            description: course.description,
            price: course.price,
            thumbnail: course.thumbnail,
            category: course.category,
            benefits: course.benefits,
            prerequisites: course.prerequisites,
            teacher: {
                _id: course.teacherId._id,
                fullName: `${course.teacherId.firstName} ${course.teacherId.lastName}`,
                profile: course.teacherId.profile,
                profilePic: course.teacherId.profilePic
            },
            averageRating: Number(averageRating),
            totalReviews: reviews.length,
            totalEnrolled,
            reviews: formattedReviews,
            faqs,
            lessons
        };

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
const getHomepageContent = async (req, res) => {
    try {
        // Top Courses
        const topCourses = await Review.aggregate([
            {
                $group: {
                    _id: "$tutorialId",
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            },
            { $sort: { averageRating: -1, reviewCount: -1 } },
            {
                $lookup: {
                    from: "tutorials",
                    localField: "_id",
                    foreignField: "_id",
                    as: "tutorial"
                }
            },
            { $unwind: "$tutorial" },
            {
                $lookup: {
                    from: "users",
                    localField: "tutorial.teacherId",
                    foreignField: "_id",
                    as: "teacher"
                }
            },
            { $unwind: "$teacher" },
            {
                $project: {
                    _id: "$tutorial._id",
                    title: "$tutorial.title",
                    thumbnail: "$tutorial.thumbnail",
                    description: "$tutorial.description",
                    price: "$tutorial.price",
                    category: "$tutorial.category",
                    averageRating: 1,
                    reviewCount: 1,
                    teacherName: {
                        $concat: ["$teacher.firstName", " ", "$teacher.lastName"]
                    }
                }
            },
            { $limit: 6 }
        ]);

        // Top Teachers (by avg review across all their courses)
        const teacherStats = await Review.aggregate([
    {
        $lookup: {
            from: "tutorials",
            localField: "tutorialId",
            foreignField: "_id",
            as: "tutorial"
        }
    },
    { $unwind: "$tutorial" },
    {
        $group: {
            _id: "$tutorial.teacherId",
            avgReview: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
        }
    },
    { $sort: { avgReview: -1, totalReviews: -1 } },
    { $limit: 3 },
    {
        $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "teacher"
        }
    },
    { $unwind: "$teacher" },
    {
        $lookup: {
            from: "tutorials",
            localField: "_id",
            foreignField: "teacherId",
            as: "courses"
        }
    },
    {
        $addFields: {
            coursesCount: { $size: "$courses" }
        }
    },
    {
        $project: {
            teacherId: "$teacher._id",
            fullName: {
                $concat: ["$teacher.firstName", " ", "$teacher.lastName"]
            },
            profile: "$teacher.profile",
            bio: "$teacher.bio",
            profilePic: "$teacher.profilePic",
            avgReviews: { $round: ["$avgReview", 1] },
            totalReviews: 1,
            coursesCount: 1
        }
    }
]);

        res.status(200).json({
            topCourses,
            topTeachers: teacherStats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};


module.exports = {
    getTeachers,
    getTopCourses,
    getAllCourses,
    getCourseDetails,
    getHomepageContent
}


const User = require('../models/User');
const Tutorial = require('../models/Tutorial');
const Review = require('../models/Review');
const Enrolled = require('../models/Enrolled');
const Score = require('../models/Score');
const Quiz = require('../models/Quiz');
const SavedTutorial = require('../models/SavedTutorial');
const Completed = require('../models/Completed');
const Admin = require('../models/Admin');
const Lesson = require('../models/Lesson');
const Resource = require('../models/Resource')
const bcrypt = require('bcrypt')

const getDateRange = (period) => {
  const now = new Date();
  let start;

  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { start, end: now };
};

exports.getOverviewStats = async (req, res) => {
    console.log("what");
  const { start, end } = getDateRange(req.query.period || 'day');

  const [tutorials, enrollments, completions] = await Promise.all([
    Tutorial.find({ createdAt: { $gte: start, $lte: end } }),
    Enrolled.find({ createdAt: { $gte: start, $lte: end } }).populate('tutorialId', 'price'),
    Completed.find({ createdAt: { $gte: start, $lte: end } })
  ]);

  const revenue = enrollments.reduce((sum, e) => sum + (e.tutorialId?.price || 0), 0);
  const activeUserIds = new Set([...enrollments.map(e => e.studentId.toString()), ...completions.map(c => c.studentId.toString())]);

  res.json({
    revenue,
    coursesCreated: tutorials.length,
    activeUsers: activeUserIds.size
  });
};

exports.getSalesPerformance = async (req, res) => {
  const { start, end } = getDateRange(req.query.period || 'month');

  const data = await Enrolled.aggregate([
    {
      $match: {
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

exports.getEnrollmentVsCompletion = async (req, res) => {
  const { start, end } = getDateRange(req.query.period || 'month');

  const tutorials = await Tutorial.find().select("_id title");

  const result = await Promise.all(
    tutorials.map(async (tutorial) => {
      const enrollments = await Enrolled.countDocuments({
        tutorialId: tutorial._id,
        createdAt: { $gte: start, $lte: end },
      });

      const completionsData = await Completed.aggregate([
  {
    $match: {
      tutorialId: tutorial._id,
      createdAt: { $gte: start, $lte: end },
    },
  },
  {
    $group: {
      _id: null,
      totalCompleted: { $sum: 1 }, // count number of completed lessons (documents)
    },
  },
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

exports.getPopularCategories = async (req, res) => {
  const { start, end } = getDateRange(req.query.period || 'month');

  const data = await Enrolled.aggregate([
    {
      $match: { createdAt: { $gte: start, $lte: end } }
    },
    {
      $lookup: {
        from: 'tutorials',
        localField: 'tutorialId',
        foreignField: '_id',
        as: 'tutorial'
      }
    },
    { $unwind: '$tutorial' },
    {
      $group: {
        _id: '$tutorial.category',
        total: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  res.json(data);
};

exports.getRecentTransactions = async (req, res) => {
  const recent = await Enrolled.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('studentId', 'firstName lastName profilePic')
    .populate('tutorialId', 'title');

  res.json(recent);
};

exports.getTopLearners = async (req, res) => {
  const { start, end } = getDateRange('month');

  const data = await Completed.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$studentId",
        totalLessons: { $sum: 1 } // ✅ one lesson per doc
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

exports.getTopTeachers = async (req, res) => {
  const { start, end } = getDateRange('month');

  const data = await Enrolled.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
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
        enrollments: { $sum: 1 }
      }
    },
    { $sort: { enrollments: -1 } },
    { $limit: 5 },
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
      $project: {
        name: { $concat: ["$teacher.firstName", " ", "$teacher.lastName"] },
        profilePic: "$teacher.profilePic",
        enrollments: 1
      }
    }
  ]);

  res.json(data);
};

exports.getTopCourses = async (req, res) => {
  const { start, end } = getDateRange('month');

  const data = await Enrolled.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
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
        from: "tutorials",
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

exports.addAdmin = async (req, res)=>{
    const {firstName, lastName, email,password ,profilePic} = req.body;
    if(!firstName || !lastName || !email || !password){
        return res.status(400).json({
            message:"Please provide the required fields"
        })
    }
    // email exists
    const emailExists = await Admin.find({email:email});
    console.log(emailExists)
    if(emailExists.length > 0){
        return res.status(400).json({
            message:"email already exists"
        })
    }
    try{
        const newAdmin = new Admin({
            firstName,
            lastName,
            email,
            profilePic,
            password:password
        })
        await newAdmin.save();
        const { password: _, ...adminData } = newAdmin.toObject();
        res.status(200).json(adminData);
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

exports.deleteUser = async (req, res)=>{
    const userId = req.params.userId;
    const {role} = req.body;
    if(!userId ||  !role){
        return res.status(400).json({
            message:"Could not delete the user"
        })
    }
    try{
        if(['teacher','student'].includes(role)){
        const deletedUser = await User.findByIdAndDelete(userId);
        res.json(deletedUser);
        }else{
            const deletedUser = await Admin.findByIdAndDelete(userId);
            res.json(deletedUser);
        }
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

exports.getAllUsers = async (req, res)=>{
    try{
        const users = await User.find().sort({ createdAt: -1 });;
        const admins = await Admin.find().sort({ createdAt: -1 });;
        const allUsers = users.concat(admins);
        res.status(200).json({
            allUsers
        })
    }catch(err){
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

exports.updateUser = async (req, res)=>{
    const userId = req.params.userId
    const {firstName, lastName, email, role, profilePic} = req.body;
    if(!firstName || !lastName || !email || !role){
        return res.status(400).json({
            message:"Please provide the required fields"
        })
    }
    try{
        if(['teacher','student'].includes(role)){
            const newUser = await User.findByIdAndUpdate(userId,
                {
                    firstName,
                    lastName,
                    email,
                    profilePic
                }
            )
            return res.status(200).json(newUser)
        }else{
            const newAdmin =await Admin.findByIdAndUpdate(userId,
                {
                    firstName,
                    lastName,
                    email,
                    profilePic
                }
            )
            return res.status(200).json(newAdmin)
        }
    }catch(err){
        console.log(err)
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}

exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.aggregate([
      {
        $lookup: {
          from: 'tutorials', 
          localField: 'tutorialId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $sort: {
          'course.createdAt': -1 // newest courses first
        }
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          title: 1,
          description: 1,
          videoUrl: 1,
          tutorial: '$course.title', 
        }
      }
    ]);

    res.status(200).json(lessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch sorted lessons.' });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Tutorial.aggregate([
      // 1. Lookup teacher info from users collection
      {
        $lookup: {
          from: "users",
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher"
        }
      },
      // 2. Flatten the teacher array
      {
        $unwind: {
          path: "$teacher",
          preserveNullAndEmptyArrays: false // remove if no match
        }
      },
      // 3. Filter only teachers (optional)
      {
        $match: {
          "teacher.role": "teacher"
        }
      },
      // 4. Sort by course creation date
      {
        $sort: {
          createdAt: -1
        }
      },
      // 5. Project the final shape
      {
        $project: {
          id: "$_id",              // rename _id to id
          title: 1,
          thumbnail: 1,
          category: 1,
          price: 1,
          instructor: {
            $concat: ["$teacher.firstName", " ", "$teacher.lastName"]
          }
        }
      }
    ]);

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error getting courses:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteCourse = async (req, res)=>{
  const courseId = req.params.courseId;
  const course = await Tutorial.findById(courseId);
  try{
    if(!course){
    return res.status(404).json({message:"course not found"})
    }

    await Lesson.deleteMany({_id:{$in:course.lessons}})

    await Resource.deleteMany({_id: {$in:course.resources}});
    await Tutorial.findByIdAndDelete(courseId);
    res.status(200).json({ message: 'Course and related content deleted successfully' });
  }catch(err){
    console.log(err);
    res.status(500).json({message:"Internale Server Error"})
  }
}

exports.deleteLesson = async (req, res)=>{
  const lessonId = req.params.lessonId;
  try{
    const lesson = await Lesson.findById(lessonId);
    if(!lesson){
      return res.status(404).json({message:"Lesson Not Found"});
    }
    await Resource.deleteMany({_id:{$in:lesson.resources}});

    await Lesson.findByIdAndDelete(lessonId);
    res.status(200).json({message:"Lesson Deleted"})
  }catch(err){
    console.log(err);
    res.status(500).json({message:"Internale Server Error"})
  }
}

exports.loginAdmin = async (req, res)=>{
   const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(401).json({ msg: "Invalid email" });

        const isMatch = await bcrypt.compare(password,admin.password)
        if (!isMatch) return res.status(401).json({ msg: "Invalid password" });

        const accessToken = admin.createAccessToken();
        const refreshToken = admin.createRefreshToken();

        const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });


        res.status(200).json({
          accessToken,
          refreshToken,
          user:{
            role:'Admin',
            firstName:admin.firstName,
            lastName:admin.lastName,
            id:admin._id
          }
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
}
require("dotenv").config();
const mongoose = require("mongoose");
const faker = require("faker");

// Models
const User = require("./models/User");
const Tutorial = require("./models/Tutorial");
const Lesson = require("./models/Lesson");
const Resource = require("./models/Resource");
const Faq = require("./models/Faq");
const Quiz = require("./models/Quiz");
const Review = require("./models/Review");
const Completed = require("./models/Completed");
const Enrolled = require("./models/Enrolled");
const SavedTutorial = require("./models/SavedTutorial");
const Score = require("./models/Score");

// DB connect
const connectDB = async () => {
  await mongoose.connect('mongodb://localhost:27017/learning-platform');
  console.log("MongoDB connected.");
};

// Clear collections
const clearDB = async () => {
  await User.deleteMany();
  await Tutorial.deleteMany();
  await Lesson.deleteMany();
  await Resource.deleteMany();
  await Faq.deleteMany();
  await Quiz.deleteMany();
  await Review.deleteMany();
  await Completed.deleteMany();
  await Enrolled.deleteMany();
  await SavedTutorial.deleteMany();
  await Score.deleteMany();
};

// Seed
const seed = async () => {
  await connectDB();
  await clearDB();
  const teachers = [];
  const students = [];

  // 1. Create Users
  for (let i = 0; i < 5; i++) {
    const teacher = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: "password123",
      role: "teacher",
      profile: faker.name.jobTitle(),
      profilePic: faker.image.avatar()
    });
    teachers.push(teacher);
  }

  for (let i = 0; i < 10; i++) {
    const student = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: "password123",
      role: "student",
      profile: faker.name.jobTitle(),
      profilePic: faker.image.avatar()
    });
    students.push(student);
  }

  // 2. Create Tutorials, Lessons, FAQs, Resources, Quizzes
  for (let i = 0; i < 3; i++) {
    const teacher = teachers[i];

    const tutorial = await Tutorial.create({
      teacherId: teacher._id,
      category: faker.commerce.department(),
      title: faker.commerce.productName(),
      thumbnail: "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg",
      description: faker.lorem.paragraph(),
      price: faker.commerce.price(),
      benefits: [
        "Improve your skills",
        "Lifetime access",
        "Certificate upon completion"
      ],
      prerequisites: [
        "Basic understanding of the subject",
        "Willingness to learn"
      ],
    });

    const res1 = await Resource.create({
      title: "Resource 1",
      path: "https://example.com/resource1.pdf"
    });

    const res2 = await Resource.create({
      title: "Resource 2",
      path: "https://example.com/resource2.pdf"
    });

    tutorial.resources.push(res1._id, res2._id);

    const lesson1 = await Lesson.create({
      title: "Introduction to Course",
      description: "This is the first lesson of the course.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      tutorialId: tutorial._id,
      resources: [res1._id]
    });

    const lesson2 = await Lesson.create({
      title: "Advanced Techniques",
      description: "In this lesson, we go deeper.",
      videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      tutorialId: tutorial._id,
      resources: [res2._id]
    });

    tutorial.lessons.push(lesson1._id, lesson2._id);

    const faq1 = await Faq.create({
      question: "Is this course for beginners?",
      answer: "Yes, absolutely!",
      tutorialId: tutorial._id
    });

    const faq2 = await Faq.create({
      question: "Can I get a certificate?",
      answer: "Yes, upon completion.",
      tutorialId: tutorial._id
    });

    tutorial.faqs.push(faq1._id, faq2._id);

    const quiz = await Quiz.create({
      tutorialId: tutorial._id,
      questions: [
        {
          question: "What is JavaScript?",
          options: ["Language", "Framework", "Library", "Tool"],
          correctAnswer: "Language"
        },
        {
          question: "Who invented JavaScript?",
          options: ["Brendan Eich", "Bill Gates", "Mark Zuckerberg", "Elon Musk"],
          correctAnswer: "Brendan Eich"
        }
      ]
    });

    tutorial.quiz = quiz._id;

    await tutorial.save();

    // Enroll students, mark lessons completed, leave reviews
    for (let j = 0; j < 5; j++) {
      const student = students[j];

      await Enrolled.create({
        studentId: student._id,
        tutorialId: tutorial._id
      });

     await Completed.create([
  {
    studentId: student._id,
    tutorialId: tutorial._id,
    lessonId: lesson1._id
  },
  {
    studentId: student._id,
    tutorialId: tutorial._id,
    lessonId: lesson2._id
  }
]);


      await SavedTutorial.create({
        studentId: student._id,
        tutorialId: tutorial._id
      });

      await Review.create({
        studentId: student._id,
        tutorialId: tutorial._id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: faker.lorem.sentence()
      });

      await Score.create({
        studentId: student._id,
        tutorialId: tutorial._id,
        quizId: quiz._id,
        score: Math.floor(Math.random() * 100)
      });
    }
  }

  console.log("✅ Database seeded successfully.");
  process.exit(0);
};

seed();

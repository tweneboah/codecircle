const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://malekurt53_db_user:bRFJEAbqKEo4Kx2T@codecircle.n5dkwpl.mongodb.net/?appName=codecircle';

async function createSampleProjects() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('codecircle');
    const projectsCollection = db.collection('projects');
    const usersCollection = db.collection('users');
    
    // First, let's create a sample user if it doesn't exist
    const sampleUser = {
      _id: new ObjectId(),
      name: 'John Doe',
      email: 'john.doe@example.com',
      profile: {
        username: 'johndoe',
        bio: 'Full-stack developer passionate about creating amazing web applications',
        location: 'San Francisco, CA',
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        profileImage: null
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isVerified: true,
      profileViews: 0
    };
    
    // Insert user if doesn't exist
    const existingUser = await usersCollection.findOne({ email: sampleUser.email });
    let userId;
    if (!existingUser) {
      await usersCollection.insertOne(sampleUser);
      userId = sampleUser._id;
      console.log('✅ Created sample user');
    } else {
      userId = existingUser._id;
      console.log('✅ Using existing user');
    }
    
    // Create sample projects
    const sampleProjects = [
      {
        _id: new ObjectId(),
        title: 'E-Commerce Platform',
        description: 'A full-featured e-commerce platform built with React and Node.js. Features include user authentication, product catalog, shopping cart, payment integration, and admin dashboard.',
        shortDescription: 'Full-featured e-commerce platform with React and Node.js',
        githubUrl: 'https://github.com/johndoe/ecommerce-platform',
        liveUrl: 'https://ecommerce-demo.vercel.app',
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
        tags: ['React', 'Node.js', 'MongoDB', 'Stripe', 'E-commerce'],
        category: 'Web Development',
        difficulty: 'Advanced',
        techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe API', 'JWT'],
        author: userId,
        authorId: userId,
        status: 'published',
        views: 245,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        _id: new ObjectId(),
        title: 'Task Management App',
        description: 'A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.',
        shortDescription: 'Collaborative task management with real-time updates',
        githubUrl: 'https://github.com/johndoe/task-manager',
        liveUrl: 'https://taskmanager-demo.netlify.app',
        imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop',
        tags: ['React', 'Socket.io', 'Node.js', 'PostgreSQL'],
        category: 'Web Development',
        difficulty: 'Intermediate',
        techStack: ['React', 'Socket.io', 'Node.js', 'PostgreSQL', 'Redux'],
        author: userId,
        authorId: userId,
        status: 'published',
        views: 189,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: new ObjectId(),
        title: 'Weather Dashboard',
        description: 'A beautiful weather dashboard that displays current weather conditions, forecasts, and weather maps using multiple weather APIs.',
        shortDescription: 'Beautiful weather dashboard with forecasts and maps',
        githubUrl: 'https://github.com/johndoe/weather-dashboard',
        liveUrl: 'https://weather-dashboard-demo.vercel.app',
        imageUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&h=400&fit=crop',
        tags: ['JavaScript', 'API', 'CSS3', 'Weather'],
        category: 'Web Development',
        difficulty: 'Beginner',
        techStack: ['HTML5', 'CSS3', 'JavaScript', 'OpenWeather API'],
        author: userId,
        authorId: userId,
        status: 'published',
        views: 156,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      },
      {
        _id: new ObjectId(),
        title: 'AI Chat Bot',
        description: 'An intelligent chatbot powered by OpenAI GPT API with conversation memory, context awareness, and custom personality settings.',
        shortDescription: 'AI chatbot with GPT integration and conversation memory',
        githubUrl: 'https://github.com/johndoe/ai-chatbot',
        liveUrl: 'https://ai-chatbot-demo.herokuapp.com',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        tags: ['AI', 'OpenAI', 'Python', 'Flask', 'NLP'],
        category: 'AI/ML',
        difficulty: 'Advanced',
        techStack: ['Python', 'Flask', 'OpenAI API', 'SQLite', 'HTML/CSS'],
        author: userId,
        authorId: userId,
        status: 'published',
        views: 312,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        _id: new ObjectId(),
        title: 'Mobile Expense Tracker',
        description: 'A React Native mobile app for tracking personal expenses with categories, budgets, and spending analytics.',
        shortDescription: 'Mobile expense tracker with budgets and analytics',
        githubUrl: 'https://github.com/johndoe/expense-tracker',
        liveUrl: null,
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
        tags: ['React Native', 'Mobile', 'Finance', 'Analytics'],
        category: 'Mobile App',
        difficulty: 'Intermediate',
        techStack: ['React Native', 'Expo', 'AsyncStorage', 'Chart.js'],
        author: userId,
        authorId: userId,
        status: 'published',
        views: 98,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05')
      }
    ];
    
    // Insert projects
    const result = await projectsCollection.insertMany(sampleProjects);
    console.log(`✅ Created ${result.insertedCount} sample projects`);
    
    // Create some sample likes and comments for the projects
    const likesCollection = db.collection('likes');
    const commentsCollection = db.collection('comments');
    
    // Create sample likes
    const sampleLikes = [];
    sampleProjects.forEach((project, index) => {
      // Create 3-8 likes per project
      const likeCount = Math.floor(Math.random() * 6) + 3;
      for (let i = 0; i < likeCount; i++) {
        sampleLikes.push({
          _id: new ObjectId(),
          user: userId,
          project: project._id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
      }
    });
    
    await likesCollection.insertMany(sampleLikes);
    console.log(`✅ Created ${sampleLikes.length} sample likes`);
    
    // Create sample comments
    const sampleComments = [];
    const commentTexts = [
      'Great project! Really impressed with the implementation.',
      'Love the UI design. Very clean and intuitive.',
      'This is exactly what I was looking for. Thanks for sharing!',
      'Awesome work! The code is well-structured and documented.',
      'Really helpful project. Going to use this as a reference.',
      'Nice use of modern technologies. Keep up the great work!'
    ];
    
    sampleProjects.forEach((project, index) => {
      // Create 1-4 comments per project
      const commentCount = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < commentCount; i++) {
        sampleComments.push({
          _id: new ObjectId(),
          user: userId,
          project: project._id,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
      }
    });
    
    await commentsCollection.insertMany(sampleComments);
    console.log(`✅ Created ${sampleComments.length} sample comments`);
    
    console.log('🎉 Sample data created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample projects:', error);
  } finally {
    await client.close();
  }
}

createSampleProjects();
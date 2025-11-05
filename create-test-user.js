const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://malekurt53_db_user:bRFJEAbqKEo4Kx2T@codecircle.n5dkwpl.mongodb.net/?appName=codecircle';

async function createTestUser() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('codecircle');
    const usersCollection = db.collection('users');
    
    // Check if test user already exists
    const existingUser = await usersCollection.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create test user
    const testUser = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      profile: {
        username: 'testuser',
        bio: 'Test user for CodeCircle platform',
        location: 'Test City',
        skills: ['JavaScript', 'React', 'Node.js'],
        profileImage: null
      },
      role: 'user',
      isActive: true,
      isVerified: true,
      isLocked: false,
      isBanned: false,
      loginAttempts: 0,
      profileViews: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(testUser);
    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await client.close();
  }
}

createTestUser();
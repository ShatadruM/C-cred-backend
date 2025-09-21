const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ccred_database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
    console.log(`📁 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

// Simple schemas for quick setup
const projectSchema = new mongoose.Schema({
  name: String,
  category: String,
  location: {
    country: String,
    state: String,
    district: String
  },
  description: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, default: 'planning' },
  estimatedCredits: Number,
  budget: {
    amount: Number,
    currency: String
  }
}, { timestamps: true });

const stakeholderSchema = new mongoose.Schema({
  name: String,
  category: String,
  contact: {
    email: String,
    phone: String
  },
  role: String,
  status: { type: String, default: 'active' }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
const Stakeholder = mongoose.model('Stakeholder', stakeholderSchema);

// Sample data
const sampleProjects = [
  {
    name: "Amaravati Green Belt Project",
    category: "reforestation",
    location: {
      country: "India",
      state: "Andhra Pradesh",
      district: "Guntur"
    },
    description: "Large-scale tree plantation around Amaravati capital region",
    startDate: new Date('2024-01-01'),
    endDate: new Date('2026-12-31'),
    status: "active",
    estimatedCredits: 50000,
    budget: {
      amount: 5000000,
      currency: "INR"
    }
  },
  {
    name: "Krishna Delta Mangrove Restoration",
    category: "wetland_restoration",
    location: {
      country: "India",
      state: "Andhra Pradesh",
      district: "Krishna"
    },
    description: "Restoration of mangrove forests in Krishna river delta",
    startDate: new Date('2024-03-01'),
    endDate: new Date('2027-02-28'),
    status: "active",
    estimatedCredits: 30000,
    budget: {
      amount: 3500000,
      currency: "INR"
    }
  },
  {
    name: "Solar Energy Carbon Offset",
    category: "renewable_energy",
    location: {
      country: "India",
      state: "Andhra Pradesh",
      district: "Kurnool"
    },
    description: "Solar power installation with carbon offset benefits",
    startDate: new Date('2024-06-01'),
    endDate: new Date('2029-05-31'),
    status: "planning",
    estimatedCredits: 75000,
    budget: {
      amount: 12000000,
      currency: "INR"
    }
  }
];

const sampleStakeholders = [
  {
    name: "EcoTech Solutions",
    category: "project_developer",
    contact: {
      email: "info@ecotech.in",
      phone: "+91-40-12345678"
    },
    role: "Carbon offset project developer"
  },
  {
    name: "Green Verify India",
    category: "verifier",
    contact: {
      email: "audit@greenverify.com",
      phone: "+91-80-87654321"
    },
    role: "Third-party verification body"
  },
  {
    name: "AP Forest Department",
    category: "government",
    contact: {
      email: "forest@ap.gov.in",
      phone: "+91-863-2340000"
    },
    role: "Government regulatory authority"
  }
];

async function seedDatabase() {
  try {
    console.log('🚀 Starting quick database seeder...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Project.deleteMany({});
    await Stakeholder.deleteMany({});
    
    // Insert sample data
    console.log('🌱 Creating sample projects...');
    const projects = await Project.insertMany(sampleProjects);
    console.log(`✅ Created ${projects.length} projects`);
    
    console.log('👥 Creating sample stakeholders...');
    const stakeholders = await Stakeholder.insertMany(sampleStakeholders);
    console.log(`✅ Created ${stakeholders.length} stakeholders`);
    
    console.log('\n🎉 Database seeding completed!');
    console.log('\n📊 Created data:');
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (${project.category})`);
    });
    
    console.log('\n👥 Created stakeholders:');
    stakeholders.forEach((stakeholder, index) => {
      console.log(`   ${index + 1}. ${stakeholder.name} (${stakeholder.category})`);
    });
    
    console.log('\n✅ Next steps:');
    console.log('   1. Refresh MongoDB Compass to see the data');
    console.log('   2. Start your Node.js server: npm run dev');
    console.log('   3. Test API: curl http://localhost:5000/projects');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
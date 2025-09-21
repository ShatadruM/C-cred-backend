const mongoose = require('mongoose');
require('dotenv').config();

const {
  Project,
  DataUpload,
  VerificationSubmission,
  CarbonCredit,
  Stakeholder,
  MarketplaceListing
} = require('../models');

const connectDB = require('../config/database');

const sampleData = {
  stakeholders: [
    {
      name: "GreenTech Solutions",
      category: "project_developer",
      contact: {
        email: "contact@greentech.com",
        phone: "+91-9876543210",
        address: "Hyderabad, Telangana, India",
        website: "https://greentech.com"
      },
      role: "Lead project developer for reforestation initiatives",
      credentials: [{
        type: "VCS Certification",
        certification: "VCS-001",
        issuedBy: "Verra",
        validUntil: new Date('2025-12-31')
      }]
    },
    {
      name: "Forest Guard India",
      category: "verifier",
      contact: {
        email: "verify@forestguard.in",
        phone: "+91-9876543211",
        address: "Bangalore, Karnataka, India"
      },
      role: "Third-party verification body",
      credentials: [{
        type: "ISO 14064 Certification",
        certification: "ISO-14064",
        issuedBy: "International Standards",
        validUntil: new Date('2026-06-30')
      }]
    },
    {
      name: "Andhra Pradesh Forest Department",
      category: "government",
      contact: {
        email: "apforest@gov.in",
        phone: "+91-40-12345678",
        address: "Amaravati, Andhra Pradesh, India"
      },
      role: "Government regulatory body"
    }
  ],

  projects: [
    {
      name: "Amaravati Green Belt Initiative",
      category: "reforestation",
      location: {
        country: "India",
        state: "Andhra Pradesh",
        district: "Guntur",
        coordinates: {
          latitude: 16.5062,
          longitude: 80.6480
        },
        area: 1000,
        address: "Amaravati Capital Region"
      },
      description: "Large-scale reforestation project to create a green belt around Amaravati",
      methodology: "VM0033",
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      status: "active",
      estimatedCredits: 50000,
      budget: {
        amount: 5000000,
        currency: "INR"
      },
      fundingSource: "government"
    },
    {
      name: "Coastal Mangrove Restoration",
      category: "wetland_restoration",
      location: {
        country: "India",
        state: "Andhra Pradesh",
        district: "Krishna",
        coordinates: {
          latitude: 16.2160,
          longitude: 81.1498
        },
        area: 500,
        address: "Krishna Delta Coast"
      },
      description: "Restoration of mangrove ecosystems along the Krishna river delta",
      methodology: "VM0033",
      startDate: new Date('2024-03-01'),
      endDate: new Date('2027-02-28'),
      status: "active",
      estimatedCredits: 30000,
      budget: {
        amount: 3000000,
        currency: "INR"
      },
      fundingSource: "mixed"
    }
  ]
};

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to database for seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await Project.deleteMany({});
    await Stakeholder.deleteMany({});
    await DataUpload.deleteMany({});
    await VerificationSubmission.deleteMany({});
    await CarbonCredit.deleteMany({});
    await MarketplaceListing.deleteMany({});

    // Insert stakeholders first
    console.log('Inserting stakeholders...');
    const stakeholders = await Stakeholder.insertMany(sampleData.stakeholders);
    console.log(`Created ${stakeholders.length} stakeholders`);

    // Add stakeholder references to projects
    sampleData.projects[0].stakeholders = [stakeholders[0]._id, stakeholders[2]._id];
    sampleData.projects[1].stakeholders = [stakeholders[0]._id, stakeholders[2]._id];

    // Insert projects
    console.log('Inserting projects...');
    const projects = await Project.insertMany(sampleData.projects);
    console.log(`Created ${projects.length} projects`);

    // Update stakeholders with project references
    await Stakeholder.findByIdAndUpdate(
      stakeholders[0]._id,
      { $push: { projects: { $each: projects.map(p => p._id) } } }
    );

    await Stakeholder.findByIdAndUpdate(
      stakeholders[2]._id,
      { $push: { projects: { $each: projects.map(p => p._id) } } }
    );

    // Create sample data uploads
    console.log('Creating sample data uploads...');
    const sampleUploads = [
      {
        projectId: projects[0]._id,
        dataType: "field_survey",
        files: [{
          name: "field_survey_jan_2024.pdf",
          type: "application/pdf",
          size: 1024000,
          path: "/uploads/field_survey_jan_2024.pdf"
        }],
        metadata: {
          collectionDate: new Date('2024-01-15'),
          location: {
            latitude: 16.5062,
            longitude: 80.6480
          },
          equipment: "GPS Survey Kit",
          methodology: "Ground-based measurement",
          qualityScore: 95,
          notes: "Initial baseline survey completed"
        },
        status: "validated",
        uploadedBy: "surveyor@greentech.com"
      },
      {
        projectId: projects[1]._id,
        dataType: "drone_imagery",
        files: [{
          name: "mangrove_aerial_march_2024.jpg",
          type: "image/jpeg",
          size: 5120000,
          path: "/uploads/mangrove_aerial_march_2024.jpg"
        }],
        metadata: {
          collectionDate: new Date('2024-03-10'),
          location: {
            latitude: 16.2160,
            longitude: 81.1498
          },
          equipment: "DJI Phantom 4 Pro",
          methodology: "Aerial photography",
          qualityScore: 90,
          notes: "High-resolution imagery of restoration site"
        },
        status: "submitted_for_verification",
        uploadedBy: "drone@greentech.com"
      }
    ];

    const uploads = await DataUpload.insertMany(sampleUploads);
    console.log(`Created ${uploads.length} data uploads`);

    // Create sample verification submission
    const verification = new VerificationSubmission({
      uploadId: uploads[1]._id,
      projectId: uploads[1].projectId,
      dataType: uploads[1].dataType,
      submittedBy: "drone@greentech.com",
      status: "approved",
      reviewedBy: "verify@forestguard.in",
      reviewedAt: new Date(),
      creditsGenerated: 1000,
      qualityScore: 90,
      comments: "Excellent documentation of mangrove restoration progress",
      metadata: uploads[1].metadata
    });

    await verification.save();
    console.log('Created verification submission');

    // Update upload with verification reference
    uploads[1].verificationId = verification._id;
    await uploads[1].save();

    // Create sample carbon credit
    const credit = new CarbonCredit({
      projectId: projects[1]._id,
      verificationId: verification._id,
      creditsAmount: 1000,
      methodology: "VM0033",
      vintage: "2024",
      status: "active",
      description: "Carbon credits from verified mangrove restoration"
    });

    await credit.save();
    console.log('Created carbon credit');

    // Create sample marketplace listing
    const listing = new MarketplaceListing({
      creditId: credit._id,
      sellerId: stakeholders[0]._id,
      price: 15.50,
      currency: "USD",
      minimumQuantity: 10,
      availableQuantity: 1000,
      description: "High-quality carbon credits from coastal mangrove restoration project",
      tags: ["mangrove", "coastal", "restoration", "verified"]
    });

    await listing.save();
    console.log('Created marketplace listing');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample data created:');
    console.log(`- ${stakeholders.length} stakeholders`);
    console.log(`- ${projects.length} projects`);
    console.log(`- ${uploads.length} data uploads`);
    console.log('- 1 verification submission');
    console.log('- 1 carbon credit');
    console.log('- 1 marketplace listing');

    console.log('\nYou can now test your API endpoints with this sample data!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();
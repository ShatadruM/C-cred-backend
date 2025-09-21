const mongoose = require('mongoose');

// Project Schema
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: [
      'reforestation',
      'afforestation', 
      'forest_conservation',
      'agroforestry',
      'wetland_restoration',
      'grassland_restoration',
      'renewable_energy',
      'energy_efficiency',
      'methane_capture',
      'soil_carbon',
      'blue_carbon'
    ]
  },
  location: {
    country: { type: String, required: true },
    state: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    area: Number, // in hectares
    address: String
  },
  description: {
    type: String,
    maxlength: 1000
  },
  methodology: {
    type: String,
    default: 'VM0033' // Verra methodology
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'suspended', 'cancelled'],
    default: 'planning'
  },
  stakeholders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stakeholder'
  }],
  estimatedCredits: {
    type: Number,
    min: 0
  },
  actualCredits: {
    type: Number,
    min: 0,
    default: 0
  },
  budget: {
    amount: Number,
    currency: { type: String, default: 'USD' }
  },
  fundingSource: {
    type: String,
    enum: ['government', 'private', 'ngo', 'international', 'mixed']
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Data Upload Schema
const dataUploadSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  dataType: {
    type: String,
    required: true,
    enum: [
      'field_survey',
      'drone_imagery', 
      'sensor_data',
      'satellite_data',
      'soil_samples',
      'water_quality',
      'biodiversity_survey',
      'carbon_measurement',
      'forest_inventory',
      'remote_sensing'
    ]
  },
  files: [{
    name: String,
    type: String,
    size: Number,
    path: String,
    checksum: String
  }],
  metadata: {
    collectionDate: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    equipment: String,
    methodology: String,
    qualityScore: Number,
    notes: String
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'validated', 'rejected', 'submitted_for_verification'],
    default: 'uploaded'
  },
  uploadedBy: {
    type: String,
    required: true
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationSubmission'
  }
}, {
  timestamps: true
});

// Verification Submission Schema
const verificationSubmissionSchema = new mongoose.Schema({
  uploadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataUpload',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  dataType: {
    type: String,
    required: true
  },
  submittedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'more_data_requested'],
    default: 'pending'
  },
  reviewedBy: String,
  reviewedAt: Date,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  creditsGenerated: {
    type: Number,
    min: 0,
    default: 0
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  comments: String,
  reason: String, // for rejection
  requiredActions: [String], // for rejection
  requestedData: [String], // for more data requests
  requestedAt: Date,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Carbon Credit Schema
const carbonCreditSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VerificationSubmission',
    required: true
  },
  serialNumber: {
    type: String,
    unique: true
  },
  creditsAmount: {
    type: Number,
    required: true,
    min: 0
  },
  methodology: {
    type: String,
    required: true,
    default: 'VM0033'
  },
  vintage: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['issued', 'active', 'retired', 'cancelled'],
    default: 'issued'
  },
  description: String,
  certificateUrl: String,
  retiredBy: String,
  retiredAt: Date,
  retirementReason: String
}, {
  timestamps: true
});

// Auto-generate serial number before saving
carbonCreditSchema.pre('save', function(next) {
  if (!this.serialNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.serialNumber = `CC-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Stakeholder Schema
const stakeholderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'project_developer',
      'verifier', 
      'government',
      'ngo',
      'research_institution',
      'local_community',
      'investor',
      'buyer',
      'consultant'
    ]
  },
  contact: {
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: String,
    address: String,
    website: String
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  role: {
    type: String,
    maxlength: 200
  },
  credentials: [{
    type: String,
    certification: String,
    issuedBy: String,
    validUntil: Date
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  verificationHistory: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    action: String,
    date: Date,
    result: String
  }]
}, {
  timestamps: true
});

// Marketplace Listing Schema
const marketplaceListingSchema = new mongoose.Schema({
  creditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CarbonCredit',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stakeholder',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  minimumQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'expired', 'cancelled'],
    default: 'active'
  },
  listedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  description: String,
  tags: [String],
  transactions: [{
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stakeholder'
    },
    quantity: Number,
    price: Number,
    transactionDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  }]
}, {
  timestamps: true
});

// Create indexes for better performance
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ 'location.country': 1, 'location.state': 1 });
dataUploadSchema.index({ projectId: 1, dataType: 1, status: 1 });
verificationSubmissionSchema.index({ status: 1, submittedAt: -1 });
carbonCreditSchema.index({ serialNumber: 1 });
carbonCreditSchema.index({ projectId: 1, status: 1 });
stakeholderSchema.index({ category: 1, status: 1 });
marketplaceListingSchema.index({ status: 1, price: 1 });

// Create models
const Project = mongoose.model('Project', projectSchema);
const DataUpload = mongoose.model('DataUpload', dataUploadSchema);
const VerificationSubmission = mongoose.model('VerificationSubmission', verificationSubmissionSchema);
const CarbonCredit = mongoose.model('CarbonCredit', carbonCreditSchema);
const Stakeholder = mongoose.model('Stakeholder', stakeholderSchema);
const MarketplaceListing = mongoose.model('MarketplaceListing', marketplaceListingSchema);

module.exports = {
  Project,
  DataUpload,
  VerificationSubmission,
  CarbonCredit,
  Stakeholder,
  MarketplaceListing
};
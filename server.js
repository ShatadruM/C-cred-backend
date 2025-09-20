const express = require("express")
const multer = require("multer")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
})

// In-memory data storage
const projects = []
const dataUploads = []
const verificationSubmissions = []
const carbonCredits = []
const stakeholders = []
const marketplaceListings = []

// Supported data types
const supportedDataTypes = [
  "field_survey",
  "drone_imagery",
  "sensor_data",
  "satellite_data",
  "soil_samples",
  "water_quality",
  "biodiversity_survey",
]

// Helper function to find item by ID
const findById = (array, id) => array.find((item) => item.id === id)

// PROJECTS ENDPOINTS
app.get("/projects", (req, res) => {
  res.json({
    success: true,
    data: projects,
    total: projects.length,
  })
})

app.post("/projects", (req, res) => {
  const { name, category, location, startDate, endDate, stakeholders: projectStakeholders } = req.body

  if (!name || !category || !location) {
    return res.status(400).json({
      success: false,
      error: "Name, category, and location are required",
    })
  }

  const project = {
    id: `PRJ-${uuidv4().slice(0, 8)}`,
    name,
    category,
    location,
    startDate,
    endDate,
    stakeholders: projectStakeholders || [],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  projects.push(project)
  res.status(201).json({
    success: true,
    data: project,
  })
})

app.get("/projects/:id", (req, res) => {
  const project = findById(projects, req.params.id)

  if (!project) {
    return res.status(404).json({
      success: false,
      error: "Project not found",
    })
  }

  res.json({
    success: true,
    data: project,
  })
})

app.put("/projects/:id", (req, res) => {
  const projectIndex = projects.findIndex((p) => p.id === req.params.id)

  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Project not found",
    })
  }

  projects[projectIndex] = {
    ...projects[projectIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }

  res.json({
    success: true,
    data: projects[projectIndex],
  })
})

app.delete("/projects/:id", (req, res) => {
  const projectIndex = projects.findIndex((p) => p.id === req.params.id)

  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Project not found",
    })
  }

  projects.splice(projectIndex, 1)
  res.json({
    success: true,
    message: "Project deleted successfully",
  })
})

// DATA UPLOAD ENDPOINTS
app.post("/data/upload", upload.array("files"), (req, res) => {
  const { projectId, dataType, metadata } = req.body

  if (!projectId || !dataType) {
    return res.status(400).json({
      success: false,
      error: "Project ID and data type are required",
    })
  }

  const project = findById(projects, projectId)
  if (!project) {
    return res.status(404).json({
      success: false,
      error: "Project not found",
    })
  }

  const upload = {
    id: `UPL-${uuidv4().slice(0, 8)}`,
    projectId,
    dataType,
    files: req.files
      ? req.files.map((file) => ({
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          path: file.path,
        }))
      : [],
    metadata: metadata ? JSON.parse(metadata) : {},
    status: "uploaded",
    createdAt: new Date().toISOString(),
  }

  dataUploads.push(upload)
  res.status(201).json({
    success: true,
    data: upload,
  })
})

app.get("/data/uploads", (req, res) => {
  const { projectId } = req.query
  let filteredUploads = dataUploads

  if (projectId) {
    filteredUploads = dataUploads.filter((upload) => upload.projectId === projectId)
  }

  res.json({
    success: true,
    data: filteredUploads,
    total: filteredUploads.length,
  })
})

app.get("/data/uploads/:id", (req, res) => {
  const upload = findById(dataUploads, req.params.id)

  if (!upload) {
    return res.status(404).json({
      success: false,
      error: "Upload not found",
    })
  }

  res.json({
    success: true,
    data: upload,
  })
})

app.delete("/data/uploads/:id", (req, res) => {
  const uploadIndex = dataUploads.findIndex((u) => u.id === req.params.id)

  if (uploadIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Upload not found",
    })
  }

  dataUploads.splice(uploadIndex, 1)
  res.json({
    success: true,
    message: "Upload deleted successfully",
  })
})

app.post("/data/uploads/:id/verify", (req, res) => {
  const upload = findById(dataUploads, req.params.id)

  if (!upload) {
    return res.status(404).json({
      success: false,
      error: "Upload not found",
    })
  }

  const submission = {
    id: `SUB-${uuidv4().slice(0, 8)}`,
    uploadId: upload.id,
    projectId: upload.projectId,
    status: "pending",
    submittedAt: new Date().toISOString(),
    dataType: upload.dataType,
    metadata: upload.metadata,
  }

  verificationSubmissions.push(submission)

  // Update upload status
  upload.status = "submitted_for_verification"

  res.json({
    success: true,
    data: submission,
  })
})

app.get("/data/types", (req, res) => {
  res.json({
    success: true,
    data: supportedDataTypes,
  })
})

app.post("/data/validate", (req, res) => {
  const { dataType, metadata } = req.body

  if (!dataType) {
    return res.status(400).json({
      success: false,
      error: "Data type is required",
    })
  }

  const isValidType = supportedDataTypes.includes(dataType)
  const validationErrors = []

  if (!isValidType) {
    validationErrors.push("Invalid data type")
  }

  if (metadata) {
    if (!metadata.collectionDate) {
      validationErrors.push("Collection date is required")
    }
    if (!metadata.location) {
      validationErrors.push("Location is required")
    }
  }

  res.json({
    success: validationErrors.length === 0,
    valid: validationErrors.length === 0,
    errors: validationErrors,
  })
})

// VERIFICATION ENDPOINTS
app.get("/verification/submissions", (req, res) => {
  const { status } = req.query
  let filteredSubmissions = verificationSubmissions

  if (status) {
    filteredSubmissions = verificationSubmissions.filter((sub) => sub.status === status)
  }

  res.json({
    success: true,
    data: filteredSubmissions,
    total: filteredSubmissions.length,
  })
})

app.get("/verification/submissions/:id", (req, res) => {
  const submission = findById(verificationSubmissions, req.params.id)

  if (!submission) {
    return res.status(404).json({
      success: false,
      error: "Submission not found",
    })
  }

  res.json({
    success: true,
    data: submission,
  })
})

app.post("/verification/submissions/:id/approve", (req, res) => {
  const submissionIndex = verificationSubmissions.findIndex((s) => s.id === req.params.id)

  if (submissionIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Submission not found",
    })
  }

  const { creditsGenerated, comments, qualityScore } = req.body

  verificationSubmissions[submissionIndex] = {
    ...verificationSubmissions[submissionIndex],
    status: "approved",
    creditsGenerated: creditsGenerated || 0,
    comments,
    qualityScore,
    approvedAt: new Date().toISOString(),
  }

  res.json({
    success: true,
    data: verificationSubmissions[submissionIndex],
  })
})

app.post("/verification/submissions/:id/reject", (req, res) => {
  const submissionIndex = verificationSubmissions.findIndex((s) => s.id === req.params.id)

  if (submissionIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Submission not found",
    })
  }

  const { reason, comments, requiredActions } = req.body

  verificationSubmissions[submissionIndex] = {
    ...verificationSubmissions[submissionIndex],
    status: "rejected",
    reason,
    comments,
    requiredActions: requiredActions || [],
    rejectedAt: new Date().toISOString(),
  }

  res.json({
    success: true,
    data: verificationSubmissions[submissionIndex],
  })
})

app.post("/verification/submissions/:id/request-more", (req, res) => {
  const submissionIndex = verificationSubmissions.findIndex((s) => s.id === req.params.id)

  if (submissionIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Submission not found",
    })
  }

  const { requestedData, comments } = req.body

  verificationSubmissions[submissionIndex] = {
    ...verificationSubmissions[submissionIndex],
    status: "more_data_requested",
    requestedData: requestedData || [],
    comments,
    requestedAt: new Date().toISOString(),
  }

  res.json({
    success: true,
    data: verificationSubmissions[submissionIndex],
  })
})

app.get("/verification/history", (req, res) => {
  const { projectId } = req.query
  let history = verificationSubmissions.filter((sub) => sub.status !== "pending")

  if (projectId) {
    history = history.filter((sub) => sub.projectId === projectId)
  }

  res.json({
    success: true,
    data: history,
    total: history.length,
  })
})

// CARBON CREDITS ENDPOINTS
app.get("/credits", (req, res) => {
  const { projectId } = req.query
  let filteredCredits = carbonCredits

  if (projectId) {
    filteredCredits = carbonCredits.filter((credit) => credit.projectId === projectId)
  }

  res.json({
    success: true,
    data: filteredCredits,
    total: filteredCredits.length,
  })
})

app.post("/credits/generate", (req, res) => {
  const { projectId, verificationId, creditsAmount, methodology, vintage, description } = req.body

  if (!projectId || !verificationId || !creditsAmount) {
    return res.status(400).json({
      success: false,
      error: "Project ID, verification ID, and credits amount are required",
    })
  }

  const project = findById(projects, projectId)
  if (!project) {
    return res.status(404).json({
      success: false,
      error: "Project not found",
    })
  }

  const verification = findById(verificationSubmissions, verificationId)
  if (!verification || verification.status !== "approved") {
    return res.status(400).json({
      success: false,
      error: "Valid approved verification required",
    })
  }

  const credit = {
    id: `CRD-${uuidv4().slice(0, 8)}`,
    projectId,
    verificationId,
    creditsAmount,
    methodology: methodology || "VM0033",
    vintage: vintage || new Date().getFullYear().toString(),
    description,
    status: "active",
    createdAt: new Date().toISOString(),
    serialNumber: `${projectId}-${vintage}-${Date.now()}`,
  }

  carbonCredits.push(credit)
  res.status(201).json({
    success: true,
    data: credit,
  })
})

app.get("/credits/portfolio", (req, res) => {
  const portfolio = {
    totalCredits: carbonCredits.reduce((sum, credit) => sum + credit.creditsAmount, 0),
    activeCredits: carbonCredits.filter((c) => c.status === "active").length,
    creditsByProject: projects.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      credits: carbonCredits.filter((c) => c.projectId === project.id),
    })),
  }

  res.json({
    success: true,
    data: portfolio,
  })
})

app.get("/credits/:id/certificate", (req, res) => {
  const credit = findById(carbonCredits, req.params.id)

  if (!credit) {
    return res.status(404).json({
      success: false,
      error: "Credit not found",
    })
  }

  const project = findById(projects, credit.projectId)

  const certificate = {
    creditId: credit.id,
    serialNumber: credit.serialNumber,
    projectName: project?.name || "Unknown Project",
    creditsAmount: credit.creditsAmount,
    methodology: credit.methodology,
    vintage: credit.vintage,
    issuedDate: credit.createdAt,
    certificateUrl: `${req.protocol}://${req.get("host")}/certificates/${credit.id}.pdf`,
  }

  res.json({
    success: true,
    data: certificate,
  })
})

// STAKEHOLDERS ENDPOINTS
app.get("/stakeholders", (req, res) => {
  const { category } = req.query
  let filteredStakeholders = stakeholders

  if (category) {
    filteredStakeholders = stakeholders.filter((s) => s.category === category)
  }

  res.json({
    success: true,
    data: filteredStakeholders,
    total: filteredStakeholders.length,
  })
})

app.post("/stakeholders", (req, res) => {
  const { name, category, contact, projects: stakeholderProjects } = req.body

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      error: "Name and category are required",
    })
  }

  const stakeholder = {
    id: `STK-${uuidv4().slice(0, 8)}`,
    name,
    category,
    contact,
    projects: stakeholderProjects || [],
    status: "active",
    createdAt: new Date().toISOString(),
  }

  stakeholders.push(stakeholder)
  res.status(201).json({
    success: true,
    data: stakeholder,
  })
})

app.get("/stakeholders/:id", (req, res) => {
  const stakeholder = findById(stakeholders, req.params.id)

  if (!stakeholder) {
    return res.status(404).json({
      success: false,
      error: "Stakeholder not found",
    })
  }

  res.json({
    success: true,
    data: stakeholder,
  })
})

app.put("/stakeholders/:id", (req, res) => {
  const stakeholderIndex = stakeholders.findIndex((s) => s.id === req.params.id)

  if (stakeholderIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Stakeholder not found",
    })
  }

  stakeholders[stakeholderIndex] = {
    ...stakeholders[stakeholderIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }

  res.json({
    success: true,
    data: stakeholders[stakeholderIndex],
  })
})

app.post("/stakeholders/:id/connect", (req, res) => {
  const stakeholder = findById(stakeholders, req.params.id)

  if (!stakeholder) {
    return res.status(404).json({
      success: false,
      error: "Stakeholder not found",
    })
  }

  res.json({
    success: true,
    message: "Connection request sent successfully",
    data: {
      stakeholderId: stakeholder.id,
      status: "connection_requested",
      requestedAt: new Date().toISOString(),
    },
  })
})

app.post("/stakeholders/:id/message", (req, res) => {
  const { message, subject } = req.body
  const stakeholder = findById(stakeholders, req.params.id)

  if (!stakeholder) {
    return res.status(404).json({
      success: false,
      error: "Stakeholder not found",
    })
  }

  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Message is required",
    })
  }

  res.json({
    success: true,
    message: "Message sent successfully",
    data: {
      stakeholderId: stakeholder.id,
      subject,
      message,
      sentAt: new Date().toISOString(),
    },
  })
})

app.get("/stakeholders/:id/projects", (req, res) => {
  const stakeholder = findById(stakeholders, req.params.id)

  if (!stakeholder) {
    return res.status(404).json({
      success: false,
      error: "Stakeholder not found",
    })
  }

  const stakeholderProjects = projects.filter((project) => stakeholder.projects.includes(project.id))

  res.json({
    success: true,
    data: stakeholderProjects,
    total: stakeholderProjects.length,
  })
})

// MARKETPLACE ENDPOINTS
app.get("/marketplace/credits", (req, res) => {
  const { category, minPrice, maxPrice } = req.query
  let filteredListings = marketplaceListings.filter((listing) => listing.status === "active")

  if (category) {
    filteredListings = filteredListings.filter((listing) => {
      const credit = findById(carbonCredits, listing.creditId)
      const project = credit ? findById(projects, credit.projectId) : null
      return project?.category === category
    })
  }

  if (minPrice) {
    filteredListings = filteredListings.filter((listing) => listing.price >= Number.parseFloat(minPrice))
  }

  if (maxPrice) {
    filteredListings = filteredListings.filter((listing) => listing.price <= Number.parseFloat(maxPrice))
  }

  res.json({
    success: true,
    data: filteredListings,
    total: filteredListings.length,
  })
})

app.post("/marketplace/credits/:id/list", (req, res) => {
  const { price, minimumQuantity, expiryDate, description } = req.body
  const credit = findById(carbonCredits, req.params.id)

  if (!credit) {
    return res.status(404).json({
      success: false,
      error: "Credit not found",
    })
  }

  if (!price || price <= 0) {
    return res.status(400).json({
      success: false,
      error: "Valid price is required",
    })
  }

  const listing = {
    id: `LST-${uuidv4().slice(0, 8)}`,
    creditId: credit.id,
    price: Number.parseFloat(price),
    minimumQuantity: minimumQuantity || 1,
    availableQuantity: credit.creditsAmount,
    expiryDate,
    description,
    status: "active",
    listedAt: new Date().toISOString(),
  }

  marketplaceListings.push(listing)
  res.status(201).json({
    success: true,
    data: listing,
  })
})

app.get("/marketplace/prices", (req, res) => {
  const activeListing = marketplaceListings.filter((l) => l.status === "active")
  const prices = activeListing.map((l) => l.price)

  const priceStats = {
    averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    totalListings: activeListing.length,
    priceRange: {
      low: prices.filter((p) => p < 10).length,
      medium: prices.filter((p) => p >= 10 && p < 20).length,
      high: prices.filter((p) => p >= 20).length,
    },
  }

  res.json({
    success: true,
    data: priceStats,
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "C-CRED API Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: "Internal server error",
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`C-CRED API Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

module.exports = app

const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Import models
const { applicationModel } = require("../models/applicationModel");
const { termModel } = require("../models/termModel");

//@desc Create a new application
//@route POST /api/applications
//@access private (members only)
const createApplication = asyncHandler(async (req, res) => {
  const {
    termApplyingFor,
    personalInfo,
    academicInfo,
    clubExperience,
    questionAnswers,
    resumeUrl,
  } = req.body;

  // Get the user ID from the authenticated user
  const userId = req.user.id;

  // Validate that the term exists and applications are open
  const term = await termModel.findById(termApplyingFor);
  if (!term) {
    res.status(404);
    throw new Error("Term not found");
  }

  const now = new Date();
  if (now < term.appReleaseDate) {
    res.status(400);
    throw new Error("Applications for this term are not yet open");
  }

  if (now > term.appDeadline) {
    res.status(400);
    throw new Error("Application deadline for this term has passed");
  }

  // Check if user already has an application for this term
  const existingApplication = await applicationModel.findOne({
    userId,
    termApplyingFor,
  });

  if (existingApplication) {
    res.status(409);
    throw new Error("User already has an application for this term");
  }

  // Validate required fields in personalInfo
  if (
    !personalInfo ||
    !personalInfo.uwEmail ||
    !personalInfo.personalEmail ||
    !personalInfo.fullName
  ) {
    res.status(400);
    throw new Error(
      "Personal information is incomplete. Please provide uwEmail, personalEmail, and fullName"
    );
  }

  // Validate required fields in academicInfo
  if (
    !academicInfo ||
    !academicInfo.program ||
    !academicInfo.academicTerm ||
    !academicInfo.location
  ) {
    res.status(400);
    throw new Error(
      "Academic information is incomplete. Please provide program, academicTerm, and location"
    );
  }

  // Validate location enum
  const validLocations = [
    "Study Term",
    "Co-op Term in Waterloo",
    "Co-op Term but can commute to Waterloo",
    "Co-op term not in Waterloo",
  ];
  if (!validLocations.includes(academicInfo.location)) {
    res.status(400);
    throw new Error(
      "Invalid location. Please select from the available options"
    );
  }

  // Validate resume URL
  if (!resumeUrl) {
    res.status(400);
    throw new Error("Resume URL is required");
  }

  // Create the application
  const application = await applicationModel.create({
    userId,
    termApplyingFor,
    personalInfo: {
      uwEmail: personalInfo.uwEmail,
      personalEmail: personalInfo.personalEmail,
      fullName: personalInfo.fullName,
    },
    academicInfo: {
      program: academicInfo.program,
      academicTerm: academicInfo.academicTerm,
      location: academicInfo.location,
    },
    clubExperience: {
      previousMember: clubExperience?.previousMember || false,
      previousExperience: clubExperience?.previousExperience || "",
    },
    questionAnswers: questionAnswers || new Map(),
    resumeUrl,
    status: "draft",
  });

  if (!application) {
    res.status(500);
    throw new Error("Failed to create application");
  }

  res.status(201).json({
    message: "Application created successfully",
    application: {
      id: application._id,
      status: application.status,
      createdAt: application.createdAt,
    },
  });
});

module.exports = {
  createApplication,
};

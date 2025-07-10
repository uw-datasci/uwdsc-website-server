const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Import models
const { applicationModel } = require("../models/applicationModel");
const { termModel } = require("../models/termModel");

//@desc Patch or create (if not already existing) an application draft
//@route POST /api/applications
//@access private (members only)
const patchApplication = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    termApplyingFor,
    personalInfo,
    academicInfo,
    clubExperience,
    questionAnswers,
    resumeUrl,
    status,
  } = req.body;

  if (!termApplyingFor) {
    res.status(400);
    throw new Error("termApplyingFor is required");
  }

  const term = await termModel.findById(termApplyingFor);
  if (!term) {
    res.status(404);
    throw new Error("Term not found");
  }

  // Try to find an existing application
  let application = await applicationModel.findOne({ userId, termApplyingFor });

  if (application) {
    // Update fields if they are present in req.body
    if (personalInfo) {
      application.personalInfo = {
        ...application.personalInfo,
        ...personalInfo,
      };
    }

    if (academicInfo) {
      application.academicInfo = {
        ...application.academicInfo,
        ...academicInfo,
      };
    }

    if (clubExperience) {
      application.clubExperience = {
        ...application.clubExperience,
        ...clubExperience,
      };
    }

    if (questionAnswers) application.questionAnswers = questionAnswers;

    if (resumeUrl !== undefined) application.resumeUrl = resumeUrl;

    application.status = status;
    await application.save();
  } else {
    application = await applicationModel.create({
      userId,
      termApplyingFor,
      personalInfo: personalInfo || {},
      academicInfo: academicInfo || {},
      clubExperience: clubExperience || {},
      questionAnswers: questionAnswers || new Map(),
      resumeUrl: resumeUrl || "",
      status: "draft",
    });
  }

  res.status(200).json({
    message: "Application draft saved",
    application: {
      id: application._id,
      status: application.status,
      updatedAt: application.updatedAt,
    },
  });
});

//@desc Get application by user ID for the current term
//@route GET /api/applications/user
//@access private (members only)
const getCurrentApplicationByUserId = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Find the current term (where applications are currently open)
  // Convert dates to ISO strings to match the database format
  const currentTerm = await termModel.findOne({
    appReleaseDate: { $lte: now.toISOString() },
    appDeadline: { $gte: now.toISOString() },
  });

  // If no current term found, try to find the most recent term
  let term = currentTerm;
  if (!term) term = await termModel.findOne().sort({ appDeadline: -1 });

  if (!term) {
    res.status(404);
    throw new Error("No terms found");
  }

  // Find the application for this user and term
  const application = await applicationModel
    .findOne({
      userId,
      termApplyingFor: term._id,
    })
    .populate(
      "termApplyingFor",
      "termName appReleaseDate appDeadline questions"
    );

  // If no application found, return empty response (not an error)
  if (!application) {
    return res.status(200).json({
      message: `No application found for the ${
        currentTerm ? "current" : "most recent"
      } term`,
      application: null,
      term: {
        id: term._id,
        termName: term.termName,
        appReleaseDate: term.appReleaseDate,
        appDeadline: term.appDeadline,
        isCurrent: !!currentTerm,
      },
    });
  }

  // Return the application data
  res.status(200).json({
    message: "Application found",
    application: application.toJSON(),
    term: { isCurrent: !!currentTerm },
  });
});

//@desc Get current term for applications
//@route GET /api/applications/currentTerm
//@access public
const getCurrentTerm = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find the current term (where applications are currently open)
  // Convert dates to ISO strings to match the database format
  const currentTerm = await termModel.findOne({
    appReleaseDate: { $lte: now },
    appDeadline: { $gte: now },
  });

  if (!currentTerm) {
    return res.status(200).json({
      message: "Applications are not currently open",
      term: null,
      isOpen: false,
    });
  }

  res.status(200).json({
    message: "Applications are currently open",
    term: {
      id: currentTerm._id,
      termName: currentTerm.termName,
      appReleaseDate: currentTerm.appReleaseDate,
      appDeadline: currentTerm.appDeadline,
      questions: currentTerm.questions,
    },
    isOpen: true,
  });
});

module.exports = {
  patchApplication,
  getApplicationByUserId: getCurrentApplicationByUserId,
  getCurrentTerm,
};

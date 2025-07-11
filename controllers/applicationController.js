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
    rolesApplyingFor,
    roleQuestionAnswers,
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

  // Validate that selected roles exist in the term
  if (rolesApplyingFor && rolesApplyingFor.length > 0) {
    const availableRoles = term.getAvailableRoles();
    const invalidRoles = rolesApplyingFor.filter(role => !availableRoles.includes(role));
    if (invalidRoles.length > 0) {
      res.status(400);
      throw new Error(`Invalid roles: ${invalidRoles.join(', ')}. Available roles: ${availableRoles.join(', ')}`);
    }
  }

  // Try to find an existing application
  let application = await applicationModel.findOne({ userId, termApplyingFor });

  if (application) {
    // Update fields if they are present in req.body
    if (rolesApplyingFor) application.rolesApplyingFor = rolesApplyingFor;

    if (roleQuestionAnswers) {
      // Handle Map updates properly
      for (const [role, answers] of Object.entries(roleQuestionAnswers)) {
        const existingAnswers = application.roleQuestionAnswers.get(role) || new Map();
        
        // Merge new answers with existing ones
        for (const [questionId, answer] of Object.entries(answers)) {
          existingAnswers.set(questionId, answer);
        }
        
        application.roleQuestionAnswers.set(role, existingAnswers);
      }
    }

    if (resumeUrl !== undefined) application.resumeUrl = resumeUrl;
    if (status !== undefined) application.status = status;
    
    await application.save();
  } else {
    // Create new application
    const newApplication = {
      userId,
      termApplyingFor,
      rolesApplyingFor: rolesApplyingFor || [],
      resumeUrl: resumeUrl || "",
      status: status || "draft",
    };

    // Handle roleQuestionAnswers for new application
    if (roleQuestionAnswers) {
      const roleAnswersMap = new Map();
      for (const [role, answers] of Object.entries(roleQuestionAnswers)) {
        roleAnswersMap.set(role, new Map(Object.entries(answers)));
      }
      newApplication.roleQuestionAnswers = roleAnswersMap;
    }

    application = await applicationModel.create(newApplication);
  }

  res.status(200).json({
    message: "Application draft saved",
    application: {
      id: application._id,
      userId: application.userId,
      termApplyingFor: application.termApplyingFor,
      rolesApplyingFor: application.rolesApplyingFor,
      status: application.status,
      createdAt: application.createdAt,
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
  const currentTerm = await termModel.findOne({
    appReleaseDate: { $lte: now },
    appHardDeadline: { $gte: now },
  });

  // If no current term found, try to find the most recent term
  let term = currentTerm;
  if (!term) term = await termModel.findOne().sort({ appReleaseDate: -1 });

  if (!term) {
    res.status(404);
    throw new Error("No terms found");
  }

  // Find the application for this user and term
  const application = await applicationModel.findOne({
    userId,
    termApplyingFor: term._id,
  });

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
        appDeadline: term.appSoftDeadline,
        isCurrent: !!currentTerm,
        questions: [],
      },
    });
  }

  // Return the application data
  res.status(200).json({
    message: "Application found",
    application: application.toJSON(),
    term: {
      id: term._id,
      termName: term.termName,
      appReleaseDate: term.appReleaseDate,
      appDeadline: term.appSoftDeadline,
      isCurrent: !!currentTerm,
      questions: term.questions,
    },
  });
});

//@desc Get current term for applications
//@route GET /api/applications/currentTerm
//@access public
const getCurrentTerm = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find the current term (where applications are currently open)
  const currentTerm = await termModel.findOne({
    appReleaseDate: { $lte: now },
    appHardDeadline: { $gte: now },
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
      appDeadline: currentTerm.appSoftDeadline,
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

"use strict";

const Conflict                = require("../models/Conflict");
const Project                 = require("../models/Project");
const { detectAllConflicts }  = require("../engines/conflict/conflict.engine");
const { scoreConflict }       = require("../engines/mcdm/mcdm.engine");
const { buildExecutionOrder } = require("../engines/graph/graph.engine");
const { emitClashDetected }   = require("./notification.service");
const logger                  = require("../utils/logger");

// ---------------------------------------------------------------------------
// decision.service.js
//
// Orchestrates the full decision pipeline triggered on every new project:
//
//   Step 1 â€” Conflict Engine: find all existing projects that clash
//   Step 2 â€” MCDM Engine:     score each conflicting pair via TOPSIS
//   Step 3 â€” Graph Engine:    build DAG, run topological sort
//   Step 4 â€” Persist:         save Conflict documents to MongoDB
//   Step 5 â€” Notify:          emit clash:detected via Socket.io stub
//
// Engines receive plain JS objects â€” never Mongoose documents.
// All DB access happens here in the service, not inside engines.
// ---------------------------------------------------------------------------

/**
 * Runs the full decision pipeline for a newly submitted project.
 * Called by project.service.js immediately after saving a new project.
 *
 * @param {object} newProject        - Saved Mongoose project document
 * @param {object[]} candidateProjects - Existing active projects to check against (plain objects)
 * @returns {object[]}               - Array of saved Conflict documents
 */
const runDecisionPipeline = async (newProject, candidateProjects) => {
  // Convert newProject Mongoose doc to plain object for engines
  const newProjectPlain = newProject.toObject ? newProject.toObject() : newProject;

  // -------------------------------------------------------------------------
  // Step 1 â€” Conflict Engine
  // Detect all spatial + temporal clashes with existing projects
  // -------------------------------------------------------------------------
  const clashes = detectAllConflicts(newProjectPlain, candidateProjects);

  if (clashes.length === 0) {
    logger.info(`[DecisionService] No conflicts detected for project ${newProject._id}`);
    return [];
  }

  logger.info(`[DecisionService] ${clashes.length} conflict(s) detected for project ${newProject._id}`);

  // -------------------------------------------------------------------------
  // Step 2 â€” MCDM Engine + Step 3 â€” Graph Engine
  // Score each conflicting pair and determine execution order
  // -------------------------------------------------------------------------
  const savedConflicts = [];

  // Gather all involved projects (new + all conflicting) for graph ordering
  const allInvolvedProjects = [newProjectPlain, ...clashes.map((c) => c.conflictingProject)];

  // Build flat scores map for graph engine tie-breaking
  const allScores = {};

  // Collect conflict data structures for graph engine
  const conflictEdges = [];

  // Score each clash independently
  for (const clash of clashes) {
    const existingProject = clash.conflictingProject;

    // -----------------------------------------------------------------------
    // Step 2a â€” Check for duplicate conflict (A vs B already exists)
    // Prevent creating duplicate Conflict documents if both projects
    // submit at the same time or a re-check is triggered
    // -----------------------------------------------------------------------
    const existingConflict = await Conflict.findOne({
      $or: [
        { projectA: newProject._id, projectB: existingProject._id },
        { projectA: existingProject._id, projectB: newProject._id },
      ],
      status: { $in: ["open"] },
    });

    if (existingConflict) {
      logger.info(
        `[DecisionService] Conflict already exists for projects ${newProject._id} and ${existingProject._id} â€” skipping`
      );
      savedConflicts.push(existingConflict);
      continue;
    }

    // -----------------------------------------------------------------------
    // Step 2b â€” MCDM Engine: score this pair
    // -----------------------------------------------------------------------
    const mcdmResult = scoreConflict(newProjectPlain, existingProject);

    // Accumulate scores into flat map for graph engine
    Object.assign(allScores, mcdmResult.scores);

    // Store conflict edge data for graph engine
    conflictEdges.push({
      projectAId: newProject._id.toString(),
      projectBId: existingProject._id.toString(),
      scores:     mcdmResult.scores,
    });

    // -----------------------------------------------------------------------
    // Step 3 â€” Graph Engine: build execution order for this pair
    // Pass all involved projects so the DAG has full context
    // -----------------------------------------------------------------------
    const graphResult = buildExecutionOrder(
      allInvolvedProjects,
      conflictEdges,
      allScores
    );

    if (graphResult.hasCycle) {
      logger.warn(
        `[DecisionService] Cycle detected in dependency graph for project ${newProject._id} â€” proceeding with MCDM order only`
      );
    }

    // -----------------------------------------------------------------------
    // Step 4 â€” Persist Conflict document
    // -----------------------------------------------------------------------
    const conflict = await Conflict.create({
      projectA:     newProject._id,
      projectB:     existingProject._id,
      overlapArea:  clash.overlapArea,
      overlapDates: clash.overlapDates,
      status:       "open",
      recommendation: {
        order:       mcdmResult.order,
        scores:      {
          projectA: mcdmResult.scores[newProject._id.toString()],
          projectB: mcdmResult.scores[existingProject._id.toString()],
        },
        explanation: mcdmResult.explanation,
      },
    });

    // Update both projects' mcdmScore fields with computed TOPSIS scores
    await Project.findByIdAndUpdate(newProject._id, {
      mcdmScore: mcdmResult.scores[newProject._id.toString()] || null,
    });
    await Project.findByIdAndUpdate(existingProject._id, {
      mcdmScore: mcdmResult.scores[existingProject._id.toString()] || null,
    });

    savedConflicts.push(conflict);

    // -----------------------------------------------------------------------
    // Step 5 â€” Notify via Socket.io stub
    // Phase 4 will replace stub body with real emit
    // -----------------------------------------------------------------------
    emitClashDetected(conflict._id.toString(), [
      newProject._id.toString(),
      existingProject._id.toString(),
    ]);

    logger.info(
      `[DecisionService] Conflict saved: ${conflict._id} â€” ` +
      `"${newProjectPlain.title}" vs "${existingProject.title}" â€” ` +
      `winner: ${mcdmResult.order[0]}`
    );
  }

  return savedConflicts;
};

module.exports = { runDecisionPipeline };

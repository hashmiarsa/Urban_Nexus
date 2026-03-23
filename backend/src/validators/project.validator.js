"use strict";

const Joi = require("joi");

// ---------------------------------------------------------------------------
// Reusable field definitions
// ---------------------------------------------------------------------------
const objectId = Joi.string()
  .hex()
  .length(24)
  .messages({
    "string.hex":    "Must be a valid ID",
    "string.length": "Must be a valid ID",
  });

const criteriaField = Joi.number()
  .integer()
  .min(1)
  .max(10)
  .messages({
    "number.min":     "Criteria value must be between 1 and 10",
    "number.max":     "Criteria value must be between 1 and 10",
    "number.integer": "Criteria value must be a whole number",
  });

// ---------------------------------------------------------------------------
// GeoJSON Polygon coordinates validator
// Expects: [[[lng, lat], [lng, lat], ...]]
// Rules:
//   - At least 1 ring (outer boundary)
//   - Each ring has at least 4 positions (first and last must be identical)
//   - Each position is [longitude, latitude]
//   - Longitude: -180 to 180
//   - Latitude:  -90  to 90
// ---------------------------------------------------------------------------
const coordinatesSchema = Joi.array()
  .items(
    Joi.array()
      .items(
        Joi.array()
          .items(Joi.number())
          .length(2)
          .custom((value, helpers) => {
            const [lng, lat] = value;
            if (lng < -180 || lng > 180) {
              return helpers.error("any.invalid");
            }
            if (lat < -90 || lat > 90) {
              return helpers.error("any.invalid");
            }
            return value;
          })
          .messages({
            "any.invalid": "Each coordinate must be [longitude, latitude] with valid ranges",
            "array.length": "Each coordinate must have exactly 2 values [longitude, latitude]",
          })
      )
      .min(4)
      .messages({
        "array.min": "A polygon ring must have at least 4 positions (first and last identical)",
      })
  )
  .min(1)
  .required()
  .messages({
    "array.min":    "Location must have at least one polygon ring",
    "any.required": "Location coordinates are required",
  });

// ---------------------------------------------------------------------------
// createProjectSchema â€” POST /api/v1/projects
// ---------------------------------------------------------------------------
const createProjectSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      "string.min":   "Title must be at least 3 characters",
      "string.max":   "Title must not exceed 200 characters",
      "any.required": "Project title is required",
    }),

  type: Joi.string()
    .valid("road", "water", "electricity", "sewage", "parks", "other")
    .required()
    .messages({
      "any.only":     "Type must be one of: road, water, electricity, sewage, parks, other",
      "any.required": "Project type is required",
    }),

  department: objectId.optional().allow(null, ""),

  location: Joi.object({
    type: Joi.string()
      .valid("Polygon")
      .required()
      .messages({
        "any.only":     "Location type must be Polygon",
        "any.required": "Location type is required",
      }),
    coordinates: coordinatesSchema,
  })
    .required()
    .messages({
      "any.required": "Location is required",
    }),

  address: Joi.string().trim().max(300).optional().allow("", null),

  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      "date.format":  "Start date must be a valid ISO date",
      "any.required": "Start date is required",
    }),

  endDate: Joi.date()
    .iso()
    .greater(Joi.ref("startDate"))
    .required()
    .messages({
      "date.greater": "End date must be after start date",
      "date.format":  "End date must be a valid ISO date",
      "any.required": "End date is required",
    }),

  estimatedCost: Joi.number()
    .min(0)
    .optional()
    .messages({
      "number.min": "Estimated cost cannot be negative",
    }),

  priority: Joi.string()
    .valid("low", "medium", "high", "critical")
    .default("medium")
    .optional(),

  criteria: Joi.object({
    urgency:           criteriaField.default(5),
    socialImpact:      criteriaField.default(5),
    estimatedCost:     criteriaField.default(5),
    feasibility:       criteriaField.default(5),
    environmentImpact: criteriaField.default(5),
  }).default(),

  dependencies: Joi.array()
    .items(objectId)
    .default([])
    .optional()
    .messages({
      "array.base": "Dependencies must be an array of project IDs",
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow("", null),

}).options({ abortEarly: false });

// ---------------------------------------------------------------------------
// updateProjectSchema â€” PATCH /api/v1/projects/:id
// All fields optional â€” only validate what is sent
// Officers cannot update: department, submittedBy, mcdmScore
// Those restrictions are enforced in the service layer
// ---------------------------------------------------------------------------
const updateProjectSchema = Joi.object({
  title:         Joi.string().trim().min(3).max(200).optional(),
  type:          Joi.string().valid("road", "water", "electricity", "sewage", "parks", "other").optional(),
  address:       Joi.string().trim().max(300).optional().allow("", null),
  startDate:     Joi.date().iso().optional(),
  endDate:       Joi.date().iso().greater(Joi.ref("startDate")).optional(),
  estimatedCost: Joi.number().min(0).optional(),
  priority:      Joi.string().valid("low", "medium", "high", "critical").optional(),
  criteria:      Joi.object({
    urgency:           criteriaField.optional(),
    socialImpact:      criteriaField.optional(),
    estimatedCost:     criteriaField.optional(),
    feasibility:       criteriaField.optional(),
    environmentImpact: criteriaField.optional(),
  }).optional(),
  dependencies:  Joi.array().items(objectId).optional(),
  description:   Joi.string().trim().max(1000).optional().allow("", null),
  progress:      Joi.number().integer().min(0).max(100).optional().messages({
    "number.min": "Progress cannot be less than 0",
    "number.max": "Progress cannot exceed 100",
  }),
  assignedTo:    objectId.optional().allow(null),
}).options({ abortEarly: false });

// ---------------------------------------------------------------------------
// projectIdSchema â€” validates :id param on project routes
// ---------------------------------------------------------------------------
const projectIdSchema = Joi.object({
  id: objectId.required().messages({
    "any.required": "Project ID is required",
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
};

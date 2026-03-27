module.exports = {
  // Buffer values by project type (days after completion)
  bufferDays: {
    road_reconstruction: 14,
    road_resurfacing:     7,
    water:               10,
    sewage:              10,
    electricity_overhead: 5,
    electricity_underground: 7,
    parks:                3,
    other:                7,
  },

  // Geographic buffer by project type (meters)
  geoBuffer: {
    road:        30,
    water:       15,
    sewage:      20,
    electricity: 10,
    parks:       10,
    other:       15,
  },

  // Size buffer addition (meters)
  sizeBuffer: [
    { maxArea:  5000,  extra:  0 },
    { maxArea: 20000,  extra: 10 },
    { maxArea: 50000,  extra: 20 },
    { maxArea: 100000, extra: 30 },
    { maxArea: Infinity, extra: 40 },
  ],

  // Work type conflict matrix
  // incompatible / conditional / compatible
  conflictMatrix: {
    road:        { road:"incompatible", water:"incompatible", electricity:"conditional", sewage:"incompatible", parks:"conditional"  },
    water:       { road:"incompatible", water:"incompatible", electricity:"compatible",  sewage:"incompatible", parks:"compatible"   },
    electricity: { road:"conditional",  water:"compatible",   electricity:"incompatible",sewage:"compatible",   parks:"compatible"   },
    sewage:      { road:"incompatible", water:"incompatible", electricity:"compatible",  sewage:"incompatible", parks:"compatible"   },
    parks:       { road:"conditional",  water:"compatible",   electricity:"compatible",  sewage:"compatible",   parks:"incompatible" },
  },

  // Seasonal calendar for Ghaziabad
  seasonal: {
    city: "Ghaziabad",
    monsoon:    [6,7,8,9],
    drySeason:  [10,11,12,1,2,3],
    preMonsoon: [4,5],
  },

  // Infrastructure lifecycle (years)
  lifecycle: {
    road:        10,
    water:       20,
    sewage:      15,
    electricity: 15,
    parks:        8,
    other:       10,
  },

  // MCDM weights
  mcdmWeights: {
    conditionSeverity:    0.26,
    populationImpact:     0.21,
    seasonalCompatibility:0.16,
    executionReadiness:   0.16,
    citizenDisruption:    0.10,
    infrastructureAge:    0.08,
    economicValue:        0.03,
  },
}

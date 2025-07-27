// src/utils/prUtils.js

export const calculatePerformanceScore = (set) => {
  const reps = set.rep_count || 0;
  // Treat 0-lb resistance as 1 lb to allow scoring for unweighted exercises
  const resistance = set.resistanceWeight > 0 ? set.resistanceWeight : 1;
  return reps * resistance;
};

export const isNewPR = (prevBestSet, newSet) => {
  const prevScore = calculatePerformanceScore(prevBestSet);
  const newScore = calculatePerformanceScore(newSet);
  return newScore > prevScore;
};

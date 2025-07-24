// src/utils/prUtils.js

export const calculatePerformanceScore = (set, bodyWeight = 0, isBodyweight = false) => {
  const reps = set.rep_count || 0;
  const resistance = isBodyweight
    ? bodyWeight + (set.resistanceWeight || 0)
    : set.resistanceWeight || 0;

  return reps * resistance;
};

export const isNewPR = (prevBestSet, newSet, bodyWeight = 0, isBodyweight = false) => {
  const prevScore = calculatePerformanceScore(prevBestSet, bodyWeight, isBodyweight);
  const newScore = calculatePerformanceScore(newSet, bodyWeight, isBodyweight);
  return newScore > prevScore;
};

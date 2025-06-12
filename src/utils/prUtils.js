// src/utils/prUtils.js
export function isNewPR(currentPr, newSet) {
  const oldReps = currentPr.reps ?? 0;
  const oldW    = currentPr.resistanceWeight ?? 0;
  const oldH    = currentPr.resistanceHeight ?? 0;

  const reps   = newSet.rep_count ?? 0;
  const weight = newSet.resistanceWeight ?? 0;
  const height = newSet.resistanceHeight ?? 0;

  // first-ever PR
  if (oldReps === 0 && oldW === 0 && oldH === 0 && (reps>0 || weight>0 || height>0)) {
    return true;
  }

  // then any improvement in one metric while holding the others at least as high:
  const repsPr   = reps  > oldReps && weight >= oldW && height >= oldH;
  const weightPr = weight> oldW    && reps   >= oldReps && height >= oldH;
  const heightPr = height> oldH    && reps   >= oldReps && weight >= oldW;

  return repsPr || weightPr || heightPr;
}

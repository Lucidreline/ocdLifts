// src/utils/sessionUtils.js

/**
 * Map raw Firestore session document data into our component state shape.
 * Pure conversion, no side-effects.
 */
export function mapSessionDoc(id, data) {
  return {
    id,
    pr_hit: data.pr_hit || false,
    body_weight: data.body_weight ?? null,
    session_notes: data.session_notes || "",
    category: data.category || "",
    set_ids: data.set_ids || [],
    date: data.date || "",
  };
}

/**
 * Given an array of set objects, extract unique exercise IDs.
 */
export function extractExerciseIds(setsArray) {
  return [...new Set(setsArray.map((s) => s.exerciseId))];
}

/**
 * Enrich and sort raw sets data:
 * - Adds `exerciseName` from the provided map
 * - Sorts sets by timestamp descending
 */
export function enrichAndSortSets(setsArray, exerciseNameMap) {
  return setsArray
    .map((s) => ({
      ...s,
      exerciseName: exerciseNameMap[s.exerciseId] || "Unknown Exercise",
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Convert Firestore DocumentSnapshots into a map of id -> display string.
 * The display string is "Name (variation)" if variation exists, otherwise just the name.
 */
export function buildExerciseMap(exerciseDocs) {
  return exerciseDocs.reduce((map, doc) => {
    const data = doc.data();
    const display = data.name + (data.variation ? ` (${data.variation})` : "");
    map[doc.id] = display;
    return map;
  }, {});
}

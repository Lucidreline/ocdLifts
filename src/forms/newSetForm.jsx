// src/forms/newSetForm.jsx
import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

const NewSetForm = ({
  sessionId,
  sessionCategory,
  defaultExerciseId,
  onExerciseChange,
  onCreated,
}) => {
  const [exerciseId, setExerciseId] = useState(defaultExerciseId || "");
  const [exercises, setExercises] = useState([]);
  const [repCount, setRepCount] = useState("");
  const [intensity, setIntensity] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  // Whenever sessionCategory changes, fetch the dropdown list of exercises of that category
  useEffect(() => {
    if (!sessionCategory) {
      setExercises([]);
      setExerciseId("");
      return;
    }
    (async () => {
      const q = query(
        collection(db, "exercises"),
        where("category", "==", sessionCategory)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExercises(data);

      // If the last selected ID isn’t in this category’s list, clear out
      if (defaultExerciseId) {
        const found = data.find((e) => e.id === defaultExerciseId);
        if (!found) setExerciseId("");
      }
    })();
  }, [sessionCategory, defaultExerciseId]);

  // If parent tells us to switch the default exerciseId, update local state
  useEffect(() => {
    if (defaultExerciseId) {
      setExerciseId(defaultExerciseId);
    }
  }, [defaultExerciseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseId) return;

    // Build payload and create new set
    const payload = {
      sessionId,
      exerciseId,
      rep_count: repCount ? Number(repCount) : null,
      intensity: intensity ? Number(intensity) : null,
      resistanceWeight: weight ? Number(weight) : null,
      resistanceHeight: height ? Number(height) : null,
      set_notes: notes,
      timestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "sets"), payload);

    // Notify parent (SessionPage) that a set was created, so it can re‐load + check PR
    onCreated(docRef.id);

    // Also pass back the chosen exercise ID so it becomes the “lastExerciseId”
    onExerciseChange(exerciseId);

    // Clear form (keep the same exerciseId for subsequent sets)
    setRepCount("");
    setIntensity("");
    setWeight("");
    setHeight("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label className="block mb-1">Exercise</label>
        <select
          value={exerciseId}
          onChange={(e) => {
            setExerciseId(e.target.value);
            onExerciseChange(e.target.value);
          }}
          className="w-full p-2 border rounded"
        >
          <option value="">— select exercise —</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} {e.variation && `(${e.variation})`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          placeholder="Reps"
          value={repCount}
          onChange={(e) => setRepCount(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Intensity"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Height"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="p-2 border rounded"
        />
      </div>

      <div>
        <input
          type="text"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Set
      </button>
    </form>
  );
};

export default NewSetForm;

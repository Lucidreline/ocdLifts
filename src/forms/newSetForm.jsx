// src/forms/newSetForm.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const NewSetForm = ({
  session,
  defaultExerciseId,
  onExerciseChange = () => { },
  onCreated = () => { },
}) => {
  const [exerciseId, setExerciseId] = useState(defaultExerciseId || "");
  const [exercises, setExercises] = useState([]);
  const [repCount, setRepCount] = useState("");
  const [intensity, setIntensity] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [notes, setNotes] = useState("");

  // Load exercises that match session category
  useEffect(() => {
    if (!session?.category) {
      setExercises([]);
      return;
    }
    (async () => {
      const q = query(
        collection(db, "exercises"),
        where("category", "==", session.category)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExercises(data);

      // Validate existing selection
      if (defaultExerciseId) {
        const found = data.find((e) => e.id === defaultExerciseId);
        if (!found) setExerciseId("");
      }
    })();
  }, [session?.category, defaultExerciseId]);

  useEffect(() => {
    if (defaultExerciseId) {
      setExerciseId(defaultExerciseId);
    }
  }, [defaultExerciseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseId || !session?.id) return;

    const payload = {
      sessionId: session.id,
      exerciseId,
      rep_count: repCount ? Number(repCount) : null,
      intensity: intensity ? Number(intensity) : null,
      resistanceWeight: weight ? Number(weight) : null,
      resistanceHeight: height ? Number(height) : null,
      set_notes: notes,
      timestamp: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, "sets"), payload);

      // Add the new set ID to the session's set_ids array
      await updateDoc(doc(db, "sessions", session.id), {
        set_ids: arrayUnion(docRef.id),
      });

      onCreated(docRef.id);
      onExerciseChange(exerciseId);

      // Reset
      setRepCount("");
      setIntensity("");
      setWeight("");
      setHeight("");
      setNotes("");
    } catch (error) {
      console.error("Failed to create set or update session:", error);
    }
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

      <input
        type="text"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full p-2 border rounded"
      />

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

import React, { useState, useEffect } from "react";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

const NewSetForm = ({ sessionId, sessionCategory, onCreated }) => {
  const [data, setData] = useState({
    rep_count: "",
    intensity: "",
    exerciseId: "",
    resistanceWeight: "",
    resistanceHeight: "",
    set_notes: "",
  });
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fetch session category then load exercises matching that category
  useEffect(() => {
    // if no category yet, clear list
    if (!sessionCategory) {
      setExercises([]);
      return;
    }

    (async () => {
      // fetch only exercises matching the new category
      const q = query(
        collection(db, "exercises"),
        where("category", "==", sessionCategory)
      );
      const snap = await getDocs(q);
      setExercises(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [sessionCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
        sessionId,
      };
      const docRef = await addDoc(collection(db, "sets"), payload);
      onCreated(docRef.id);
      // reset form
      setData({
        rep_count: "",
        intensity: "",
        exerciseId: "",
        resistanceWeight: "",
        resistanceHeight: "",
        set_notes: "",
      });
    } catch (err) {
      console.error("Error saving set:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border-t">
      <h3 className="text-lg font-medium">New Set</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Exercise selector filtered by session category */}
        <div className="col-span-2">
          <label className="block mb-1">Exercise</label>
          <select
            name="exerciseId"
            value={data.exerciseId}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">— select exercise —</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
                {ex.variation ? ` (${ex.variation})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Reps */}
        <input
          name="rep_count"
          type="number"
          placeholder="Reps"
          value={data.rep_count}
          onChange={handleChange}
          className="p-2 border rounded"
          min="0"
        />
        {/* Intensity */}
        <input
          name="intensity"
          type="number"
          placeholder="Intensity 1–10"
          value={data.intensity}
          onChange={handleChange}
          className="p-2 border rounded"
          min="1"
          max="10"
        />

        {/* Weight */}
        <input
          name="resistanceWeight"
          type="number"
          placeholder="Weight"
          value={data.resistanceWeight}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        {/* Height */}
        <input
          name="resistanceHeight"
          type="number"
          placeholder="Height"
          value={data.resistanceHeight}
          onChange={handleChange}
          className="p-2 border rounded"
        />

        {/* Notes */}
        <input
          name="set_notes"
          placeholder="Notes"
          value={data.set_notes}
          onChange={handleChange}
          className="p-2 border rounded col-span-2"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-2 text-white rounded ${
          saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {saving ? "Adding…" : "Add Set"}
      </button>
    </form>
  );
};

export default NewSetForm;

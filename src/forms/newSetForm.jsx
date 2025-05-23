import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/firebase";

const NewSetForm = ({ sessionId, onCreated }) => {
  const [data, setData] = useState({
    rep_count: "",
    intensity: "",
    exerciseId: "",
    resistanceWeight: "",
    resistanceHeight: "",
    set_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
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
      setData({
        rep_count: "",
        intensity: "",
        exerciseId: "",
        resistanceWeight: "",
        resistanceHeight: "",
        set_notes: "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4 border-t">
      <h3 className="text-lg">New Set</h3>
      <div className="grid grid-cols-2 gap-2">
        <input
          name="exerciseId"
          placeholder="Exercise ID"
          value={data.exerciseId}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />
        <input
          name="rep_count"
          type="number"
          placeholder="Reps"
          value={data.rep_count}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          name="intensity"
          type="number"
          placeholder="Intensity (1–10)"
          min="1"
          max="10"
          value={data.intensity}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          name="resistanceWeight"
          type="number"
          placeholder="Weight"
          value={data.resistanceWeight}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          name="resistanceHeight"
          type="number"
          placeholder="Height"
          value={data.resistanceHeight}
          onChange={handleChange}
          className="p-2 border rounded"
        />
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
        className={`mt-2 px-4 py-2 text-white rounded ${
          saving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {saving ? "Saving…" : "Add Set"}
      </button>
    </form>
  );
};

export default NewSetForm;

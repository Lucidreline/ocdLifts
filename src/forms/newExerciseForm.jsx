// src/pages/ExercisesPage.jsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Forearms",
  "Lats",
  "Traps",
  "Obliques",
];

const categories = ["Push", "Pull", "Legs"];

const NewExerciseForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    variation: "",
    primaryMuscleGroup: "",
    secondaryMuscleGroup: "",
    thirdMuscleGroup: "",
    category: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // include an empty PR object
    const payload = {
      ...formData,
      pr: {
        reps: null,
        resistanceWeight: null,
        resistanceHeight: null,
      },
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "exercises"), payload);
      // reset form
      setFormData({
        name: "",
        variation: "",
        primaryMuscleGroup: "",
        secondaryMuscleGroup: "",
        thirdMuscleGroup: "",
        category: "",
      });
      // optionally show a success toast/alert
    } catch (err) {
      console.error("Error saving exercise:", err);
      // optionally show an error message
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl mb-4">Add New Exercise</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Variation */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block mb-1">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Curls"
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Variation</label>
            <input
              name="variation"
              value={formData.variation}
              onChange={handleChange}
              placeholder="e.g. Dumbbell"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Muscle Groups */}
        <div className="flex space-x-2">
          {[
            "primaryMuscleGroup",
            "secondaryMuscleGroup",
            "thirdMuscleGroup",
          ].map((field, idx) => (
            <div key={field} className="flex-1">
              <label className="block mb-1">
                {["Primary", "Secondary", "Third"][idx]} Muscle
              </label>
              <select
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required={field === "primaryMuscleGroup"}
              >
                <option value="">— select —</option>
                {muscleGroups.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Category */}
        <div>
          <label className="block mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">— select —</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`w-full py-2 text-white rounded ${
            isSaving ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isSaving ? "Saving…" : "Save Exercise"}
        </button>
      </form>
    </div>
  );
};

export default NewExerciseForm;

// src/pages/ExercisesPage.jsx
import React, { useState } from "react";

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

const NewExercisesForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    variation: "",
    primaryMuscleGroup: "",
    secondaryMuscleGroup: "",
    thirdMuscleGroup: "",
    category: "",
    pr: {
      reps: "",
      resistanceWeight: "",
      resistanceHeight: "",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handlePrChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({
      ...fd,
      pr: { ...fd.pr, [name]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: send formData to Firestore
    console.log("submitting", formData);
    // reset or give feedback...
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

        {/* PR Fields */}
        <fieldset className="p-4 border rounded space-y-2">
          <legend className="font-medium">Personal Record</legend>
          <div className="flex space-x-2">
            <input
              type="number"
              name="reps"
              value={formData.pr.reps}
              onChange={handlePrChange}
              placeholder="Reps"
              min="0"
              className="flex-1 p-2 border rounded"
            />
            <input
              type="number"
              name="resistanceWeight"
              value={formData.pr.resistanceWeight}
              onChange={handlePrChange}
              placeholder="Weight (lbs)"
              min="0"
              className="flex-1 p-2 border rounded"
            />
            <input
              type="number"
              name="resistanceHeight"
              value={formData.pr.resistanceHeight}
              onChange={handlePrChange}
              placeholder="Height (inches)"
              min="0"
              className="flex-1 p-2 border rounded"
            />
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Exercise
        </button>
      </form>
    </div>
  );
};

export default NewExercisesForm;

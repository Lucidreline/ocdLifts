// src/pages/ExercisesPage.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import NewExercisesForm from "../forms/newExerciseForm";

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);

  // fetch all exercises on mount
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "exercises"));
      setExercises(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    })();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Exercises</h1>
      <NewExercisesForm />

      <section className="mt-8">
        <h2 className="text-xl mb-2">All Exercises</h2>
        {exercises.length === 0 ? (
          <p className="text-gray-500">No exercises yet.</p>
        ) : (
          <ul className="space-y-2">
            {exercises.map((ex) => (
              <li key={ex.id} className="border p-2 rounded hover:bg-gray-50">
                <Link
                  to={`/exercises/${ex.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {ex.name}{ex.variation ? ` (${ex.variation})` : ""}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ExercisesPage;

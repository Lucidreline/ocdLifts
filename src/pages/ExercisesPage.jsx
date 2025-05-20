import React from "react";
import NewExercisesForm from "../forms/newExerciseForm";

const ExercisesPage = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Exercises Page</h1>
      <p>Welcome to OCD Lifts! Your progress at a glance.</p>
      <NewExercisesForm />
    </div>
  );
};

export default ExercisesPage;

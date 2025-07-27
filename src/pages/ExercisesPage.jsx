import React, { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({
    name: '',
    variation: '',
    primaryMuscleGroup: '',
    secondaryMuscleGroup: '',
    thirdMuscleGroup: '',
    category: '',
  });
  const [editingExerciseId, setEditingExerciseId] = useState(null);

  useEffect(() => {
    const fetchExercises = async () => {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const fetchedExercises = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExercises(fetchedExercises);
    };

    fetchExercises();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExercise(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveExercise = async () => {
    if (editingExerciseId) {
      const docRef = doc(db, 'exercises', editingExerciseId);
      await updateDoc(docRef, newExercise);
      setEditingExerciseId(null);
    } else {
      await addDoc(collection(db, 'exercises'), newExercise);
    }

    setNewExercise({
      name: '',
      variation: '',
      primaryMuscleGroup: '',
      secondaryMuscleGroup: '',
      thirdMuscleGroup: '',
      category: '',
    });

    const querySnapshot = await getDocs(collection(db, 'exercises'));
    const updatedExercises = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExercises(updatedExercises);
  };

  const handleEditClick = (exercise) => {
    setNewExercise({
      name: exercise.name || '',
      variation: exercise.variation || '',
      primaryMuscleGroup: exercise.primaryMuscleGroup || '',
      secondaryMuscleGroup: exercise.secondaryMuscleGroup || '',
      thirdMuscleGroup: exercise.thirdMuscleGroup || '',
      category: exercise.category || '',
    });
    setEditingExerciseId(exercise.id);
  };

  return (
    <div>
      {editingExerciseId && <h2>Edit {newExercise.name}</h2>}
      {!editingExerciseId && <h1>Add New Exercise</h1>}

      <div>
        <label>Name</label>
        <input
          name="name"
          value={newExercise.name}
          onChange={handleInputChange}
          placeholder="e.g. Curls"
        />
        <br />

        <label>Variation</label>
        <input
          name="variation"
          value={newExercise.variation}
          onChange={handleInputChange}
          placeholder="e.g. Dumbbell"
        />
        <br />

        <label>Primary Muscle</label>
        <select
          name="primaryMuscleGroup"
          value={newExercise.primaryMuscleGroup}
          onChange={handleInputChange}
        >
          <option value="">-- select --</option>
          <option value="Chest (Upper)">Chest (Upper)</option>
          <option value="Chest (Middle)">Chest (Middle)</option>
          <option value="Chest (Lower)">Chest (Lower)</option>
          <option value="Back (Upper)">Back (Upper)</option>
          <option value="Back (Mid)">Back (Mid)</option>
          <option value="Back (Lower)">Back (Lower)</option>
          <option value="Lats">Lats</option>
          <option value="Traps">Traps</option>
          <option value="Rear Delts">Rear Delts</option>
          <option value="Side Delts">Side Delts</option>
          <option value="Front Delts">Front Delts</option>
          <option value="Biceps (Short Head)">Biceps (Short Head)</option>
          <option value="Biceps (Long Head)">Biceps (Long Head)</option>
          <option value="Triceps (Long Head)">Triceps (Long Head)</option>
          <option value="Triceps (Lateral Head)">Triceps (Lateral Head)</option>
          <option value="Triceps (Medial Head)">Triceps (Medial Head)</option>
          <option value="Quads">Quads</option>
          <option value="Hamstrings">Hamstrings</option>
          <option value="Glutes">Glutes</option>
          <option value="Calves">Calves</option>
          <option value="Adductors">Adductors</option>
          <option value="Abductors">Abductors</option>
          <option value="Core (Upper)">Core (Upper)</option>
          <option value="Core (Lower)">Core (Lower)</option>
          <option value="Obliques">Obliques</option>
        </select>
        <br />

        {newExercise.primaryMuscleGroup && (
          <>
            <label>Secondary Muscle</label>
            <select
              name="secondaryMuscleGroup"
              value={newExercise.secondaryMuscleGroup}
              onChange={handleInputChange}
            >
              <option value="">-- select --</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Biceps">Biceps</option>
              <option value="Triceps">Triceps</option>
              <option value="Legs">Legs</option>
              <option value="Glutes">Glutes</option>
              <option value="Core">Core</option>
            </select>
            <br />
          </>
        )}

        {newExercise.secondaryMuscleGroup && (
          <>
            <label>Third Muscle</label>
            <select
              name="thirdMuscleGroup"
              value={newExercise.thirdMuscleGroup}
              onChange={handleInputChange}
            >
              <option value="">-- select --</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Biceps">Biceps</option>
              <option value="Triceps">Triceps</option>
              <option value="Legs">Legs</option>
              <option value="Glutes">Glutes</option>
              <option value="Core">Core</option>
            </select>
            <br />
          </>
        )}

        <label>Category</label>
        <select
          name="category"
          value={newExercise.category}
          onChange={handleInputChange}
        >
          <option value="">-- select --</option>
          <option value="Push">Push</option>
          <option value="Pull">Pull</option>
          <option value="Legs">Legs</option>
        </select>
        <br />

        <button onClick={handleSaveExercise}>Save Exercise</button>
      </div>

      <h1>All Exercises</h1>
      {exercises.map((exercise) => (
        <div key={exercise.id} onClick={() => handleEditClick(exercise)}>
          {exercise.name}
        </div>
      ))}
    </div>
  );
};

export default ExercisesPage;

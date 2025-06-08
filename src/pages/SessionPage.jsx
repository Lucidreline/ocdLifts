// src/pages/SessionPage.jsx
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../firebase/firebase";

import NewSetForm from "../forms/newSetForm";

const sessionCategories = ["Push", "Pull", "Legs"];

const SessionPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [sets, setSets] = useState([]);
  const [prMessage, setPrMessage] = useState("");
  const [lastExerciseId, setLastExerciseId] = useState(null);

  // For editing a set
  const [editingSetId, setEditingSetId] = useState(null);
  const [editFields, setEditFields] = useState({
    exerciseId: "",
    rep_count: "",
    intensity: "",
    resistanceWeight: "",
    resistanceHeight: "",
    set_notes: "",
  });

  // List of exercises in this session's category (for edit dropdown)
  const [exercisesList, setExercisesList] = useState([]);

  // 1) Load session metadata on mount
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "sessions", sessionId));
      if (snap.exists()) {
        const data = snap.data();
        setSession({
          id: snap.id,
          pr_hit: data.pr_hit || false,
          body_weight: data.body_weight ?? null,
          session_notes: data.session_notes || "",
          category: data.category || "",
          set_ids: data.set_ids || [],
          date: data.date || "",
        });
      }
    })();
  }, [sessionId]);

  // 2) Whenever session.category changes, load all exercises in that category
  useEffect(() => {
    if (!session?.category) {
      setExercisesList([]);
      return;
    }
    (async () => {
      const q = query(
        collection(db, "exercises"),
        where("category", "==", session.category)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExercisesList(data);
      // If lastExerciseId not in new list, clear it
      if (lastExerciseId) {
        const found = data.find((e) => e.id === lastExerciseId);
        if (!found) setLastExerciseId("");
      }
    })();
  }, [session?.category, lastExerciseId]);

  // A helper to load all sets and enrich with exerciseName, sorted newest→oldest
  const loadSets = async () => {
    if (!session) return;
    const ids = session.set_ids || [];
    if (ids.length === 0) {
      setSets([]);
      return;
    }

    // Fetch sets
    const setQuery = query(collection(db, "sets"), where("__name__", "in", ids));
    const setSnap = await getDocs(setQuery);
    const setsData = setSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Gather unique exercise IDs
    const exIds = [...new Set(setsData.map((s) => s.exerciseId))];
    const exMap = {};
    if (exIds.length > 0) {
      const exQuery = query(
        collection(db, "exercises"),
        where("__name__", "in", exIds)
      );
      const exSnap = await getDocs(exQuery);
      exSnap.docs.forEach((d) => {
        const data = d.data();
        exMap[d.id] = data.name;
      });
    }

    // Enrich and sort
    const enriched = setsData.map((s) => ({
      ...s,
      exerciseName: exMap[s.exerciseId] || "Unknown Exercise",
    }));
    enriched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setSets(enriched);
  };

  // 3) Whenever session.set_ids changes, reload the sets
  useEffect(() => {
    loadSets();
    // eslint-disable-next-line
  }, [session]);

  // 4) Generic handler to update a single session field
  const handleFieldUpdate = (field) => async (e) => {
    const raw = e.target.value;
    const value =
      e.target.type === "number" ? (raw === "" ? null : parseFloat(raw)) : raw;
    setSession((prev) => ({ ...prev, [field]: value }));
    await updateDoc(doc(db, "sessions", sessionId), { [field]: value });
  };

  // 5) When a new set is created: same PR logic + add to session
  const handleNewSet = async (setId) => {
    // a) Mark new set hit_pr=false
    await updateDoc(doc(db, "sets", setId), { hit_pr: false });

    // b) Add ID to session.set_ids
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayUnion(setId),
    });
    setSession((prev) => ({
      ...prev,
      set_ids: [...(prev.set_ids || []), setId],
    }));

    // c) Fetch new set data
    const setSnap = await getDoc(doc(db, "sets", setId));
    const {
      exerciseId,
      rep_count,
      intensity,
      resistanceWeight,
      resistanceHeight,
    } = setSnap.data();

    // d) Fetch exercise’s current PR
    const exSnap = await getDoc(doc(db, "exercises", exerciseId));
    const exData = exSnap.data() || {};
    const currentPr = {
      reps: exData.pr?.reps ?? 0,
      resistanceWeight: exData.pr?.resistanceWeight ?? 0,
      resistanceHeight: exData.pr?.resistanceHeight ?? 0,
    };

    // e) Determine if it’s a PR
    const hadNoPrBefore =
      currentPr.reps === 0 &&
      currentPr.resistanceWeight === 0 &&
      currentPr.resistanceHeight === 0;
    const anyValue =
      (rep_count ?? 0) > 0 ||
      (resistanceWeight ?? 0) > 0 ||
      (resistanceHeight ?? 0) > 0;
    let isPr = hadNoPrBefore && anyValue;

    if (!isPr) {
      const isWeightPr =
        resistanceWeight > currentPr.resistanceWeight &&
        rep_count >= currentPr.reps &&
        resistanceHeight >= currentPr.resistanceHeight;
      const isRepsPr =
        rep_count > currentPr.reps &&
        resistanceWeight >= currentPr.resistanceWeight &&
        resistanceHeight >= currentPr.resistanceHeight;
      const isHeightPr =
        resistanceHeight > currentPr.resistanceHeight &&
        rep_count >= currentPr.reps &&
        resistanceWeight >= currentPr.resistanceWeight;
      isPr = isWeightPr || isRepsPr || isHeightPr;
    }

    // f) If PR, update exercise.pr, session.pr_hit, and this set’s hit_pr
    if (isPr) {
      const newPr = {
        reps: rep_count,
        resistanceWeight,
        resistanceHeight,
        pr_set_id: setId,
        lastUpdated: new Date().toISOString(),

      };
      await updateDoc(doc(db, "exercises", exerciseId), { pr: newPr });
      await updateDoc(doc(db, "sessions", sessionId), { pr_hit: true });
      setSession((prev) => ({ ...prev, pr_hit: true }));
      setPrMessage(
        `🎉 New PR! ${rep_count} reps, ${resistanceWeight}lbs, ${resistanceHeight} height`
      );
      setTimeout(() => setPrMessage(""), 5000);

      await updateDoc(doc(db, "sets", setId), { hit_pr: true });
    }
  };

  // 6) Delete a set: remove from Firestore and session.set_ids
  const handleDeleteSet = async (setId) => {
    await deleteDoc(doc(db, "sets", setId));
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayRemove(setId),
    });
    // Update local state
    setSets((prev) => prev.filter((s) => s.id !== setId));
    setSession((prev) => ({
      ...prev,
      set_ids: prev.set_ids.filter((id) => id !== setId),
    }));
  };

  // 7) When user clicks on a set, begin editing
  const startEditing = (s) => {
    setEditingSetId(s.id);
    setEditFields({
      exerciseId: s.exerciseId,
      rep_count: s.rep_count ?? "",
      intensity: s.intensity ?? "",
      resistanceWeight: s.resistanceWeight ?? "",
      resistanceHeight: s.resistanceHeight ?? "",
      set_notes: s.set_notes ?? "",
    });
  };

  // 8) Handle changes to the edit form fields
  const handleEditChange = (field, val) => {
    setEditFields((prev) => ({ ...prev, [field]: val }));
  };

  // 9) Save edited set back to Firestore
  const handleSaveEdit = async () => {
    if (!editingSetId) return;

    const updates = {
      exerciseId: editFields.exerciseId,
      rep_count: editFields.rep_count === "" ? null : Number(editFields.rep_count),
      intensity: editFields.intensity === "" ? null : Number(editFields.intensity),
      resistanceWeight:
        editFields.resistanceWeight === "" ? null : Number(editFields.resistanceWeight),
      resistanceHeight:
        editFields.resistanceHeight === "" ? null : Number(editFields.resistanceHeight),
      set_notes: editFields.set_notes,
    };

    await updateDoc(doc(db, "sets", editingSetId), updates);

    // Clear editing state and reload sets
    setEditingSetId(null);
    setEditFields({
      exerciseId: "",
      rep_count: "",
      intensity: "",
      resistanceWeight: "",
      resistanceHeight: "",
      set_notes: "",
    });
    loadSets();
  };

  // 10) Cancel editing
  const handleCancelEdit = () => {
    setEditingSetId(null);
    setEditFields({
      exerciseId: "",
      rep_count: "",
      intensity: "",
      resistanceWeight: "",
      resistanceHeight: "",
      set_notes: "",
    });
  };

  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      {/* Session header */}
      <h1 className="text-2xl">Session: {session.category || "Uncategorized"}</h1>
      {session.pr_hit && (
        <div className="text-green-600 font-bold">🎉 PR Hit This Session!</div>
      )}
      {prMessage && (
        <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">{prMessage}</div>
      )}

      {/* Session metadata fields */}
      <div>
        <label className="block mb-1">Body Weight (lbs)</label>
        <input
          type="number"
          step="any"
          value={session.body_weight ?? ""}
          placeholder="e.g. 195.5"
          onChange={handleFieldUpdate("body_weight")}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block mb-1">Category</label>
        <select
          value={session.category}
          onChange={handleFieldUpdate("category")}
          className="w-full p-2 border rounded"
        >
          <option value="">— select —</option>
          {sessionCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1">Notes</label>
        <textarea
          rows={3}
          value={session.session_notes}
          onChange={handleFieldUpdate("session_notes")}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* NewSetForm (to add a brand‐new set) */}
      <NewSetForm
        sessionId={sessionId}
        sessionCategory={session.category}
        defaultExerciseId={lastExerciseId}
        onExerciseChange={(id) => setLastExerciseId(id)}
        onCreated={handleNewSet}
      />

      {/* Sets list (with inline editing) */}
      <section>
        <h2 className="text-xl mb-2">Sets</h2>
        {sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          <ul className="space-y-4">
            {sets.map((s) => (
              <li key={s.id} className="border p-4 rounded">
                {editingSetId === s.id ? (
                  // Inline edit form for this set
                  <div className="space-y-2">
                    <div>
                      <label className="block mb-1">Exercise</label>
                      <select
                        value={editFields.exerciseId}
                        onChange={(e) => handleEditChange("exerciseId", e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">— select exercise —</option>
                        {exercisesList.map((e) => (
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
                        value={editFields.rep_count}
                        onChange={(e) => handleEditChange("rep_count", e.target.value)}
                        className="p-2 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Intensity"
                        value={editFields.intensity}
                        onChange={(e) => handleEditChange("intensity", e.target.value)}
                        className="p-2 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Weight"
                        value={editFields.resistanceWeight}
                        onChange={(e) => handleEditChange("resistanceWeight", e.target.value)}
                        className="p-2 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={editFields.resistanceHeight}
                        onChange={(e) => handleEditChange("resistanceHeight", e.target.value)}
                        className="p-2 border rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Notes"
                        value={editFields.set_notes}
                        onChange={(e) => handleEditChange("set_notes", e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal read‐only view
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <br></br>
                        {s.exerciseName && (
                          <div>
                            {s.hit_pr ? "PR! " + s.exerciseName : s.exerciseName}
                          </div>
                        )}
                        {s.rep_count != null && <div>{s.rep_count} Reps</div>}
                        {s.intensity != null && <div>Intensity: {s.intensity}</div>}
                        {s.resistanceWeight != null && <div>Weight: {s.resistanceWeight}</div>}
                        {s.resistanceHeight != null && <div>Height: {s.resistanceHeight}</div>}
                        {s.set_notes && <div>Notes: {s.set_notes}</div>}
                        {s.timestamp && (
                          <div className="text-sm text-gray-500">
                            {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => startEditing(s)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSet(s.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>

                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SessionPage;

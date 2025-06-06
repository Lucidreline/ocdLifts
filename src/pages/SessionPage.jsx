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

  // 2) Whenever session.set_ids changes, fetch all those set‐docs and enrich with exerciseName
  useEffect(() => {
    if (!session) return;

    const ids = session.set_ids || [];
    if (ids.length === 0) {
      setSets([]);
      return;
    }

    (async () => {
      // 2a) Fetch all set documents whose ID is in session.set_ids
      const setQuery = query(collection(db, "sets"), where("__name__", "in", ids));
      const setSnap = await getDocs(setQuery);
      const setsData = setSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2b) Gather unique exercise IDs from those sets
      const exIds = [...new Set(setsData.map((s) => s.exerciseId))];
      const exMap = {};
      if (exIds.length > 0) {
        const exQuery = query(collection(db, "exercises"), where("__name__", "in", exIds));
        const exSnap = await getDocs(exQuery);
        exSnap.docs.forEach((d) => {
          const data = d.data();
          exMap[d.id] = data.name;
        });
      }

      // 2c) Enrich each set with exerciseName, then sort by timestamp desc
      const enriched = setsData.map((s) => ({
        ...s,
        exerciseName: exMap[s.exerciseId] || "Unknown Exercise",
      }));
      enriched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setSets(enriched);
    })();
  }, [session]);

  // 3) Generic handler to update a single session field (body_weight, category, session_notes)
  const handleFieldUpdate = (field) => async (e) => {
    const raw = e.target.value;
    const value = e.target.type === "number" ? (raw === "" ? null : parseFloat(raw)) : raw;
    setSession((prev) => ({ ...prev, [field]: value }));
    await updateDoc(doc(db, "sessions", sessionId), { [field]: value });
  };

  // 4) When a new set is created:
  //    • First mark hit_pr = false
  //    • Then add it to session.set_ids
  //    • Then check for a PR; if yes, update exercise.pr, session.pr_hit, and set.hit_pr
  const handleNewSet = async (setId) => {
    // 4a) Default‐insert hit_pr: false
    await updateDoc(doc(db, "sets", setId), { hit_pr: false });

    // 4b) Add setId to session.set_ids
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayUnion(setId),
    });
    setSession((prev) => ({
      ...prev,
      set_ids: [...(prev.set_ids || []), setId],
    }));

    // 4c) Fetch the newly created set’s data
    const setSnap = await getDoc(doc(db, "sets", setId));
    const {
      exerciseId,
      rep_count,
      intensity,
      resistanceWeight,
      resistanceHeight,
    } = setSnap.data();

    // 4d) Fetch the exercise’s existing PR
    const exSnap = await getDoc(doc(db, "exercises", exerciseId));
    const exData = exSnap.data() || {};
    const currentPr = {
      reps: exData.pr?.reps ?? 0,
      resistanceWeight: exData.pr?.resistanceWeight ?? 0,
      resistanceHeight: exData.pr?.resistanceHeight ?? 0,
    };

    // 4e) Determine if this new set is a PR
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

    // 4f) If it’s a PR, update exercise.pr, session.pr_hit, and set.hit_pr
    if (isPr) {
      const newPr = {
        reps: rep_count,
        resistanceWeight,
        resistanceHeight,
        lastUpdated: new Date().toISOString(),
      };
      await updateDoc(doc(db, "exercises", exerciseId), { pr: newPr });
      await updateDoc(doc(db, "sessions", sessionId), { pr_hit: true });
      setSession((prev) => ({ ...prev, pr_hit: true }));
      setPrMessage(
        `🎉 New PR! ${rep_count} reps, ${resistanceWeight}lbs, ${resistanceHeight} height`
      );
      setTimeout(() => setPrMessage(""), 5000);

      // Finally, mark this set document’s `hit_pr: true`
      await updateDoc(doc(db, "sets", setId), { hit_pr: true });
    }
  };

  // 5) Delete a set: remove it from Firestore and from session.set_ids
  const handleDeleteSet = async (setId) => {
    await deleteDoc(doc(db, "sets", setId));
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayRemove(setId),
    });
    setSets((prev) => prev.filter((s) => s.id !== setId));
    setSession((prev) => ({
      ...prev,
      set_ids: prev.set_ids.filter((id) => id !== setId),
    }));
  };

  // If session hasn't loaded yet, show a loading state
  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      {/* Session header */}
      <h1 className="text-2xl">
        Session: {session.category || "Uncategorized"}
      </h1>
      {session.pr_hit && (
        <div className="text-green-600 font-bold">🎉 PR Hit This Session!</div>
      )}
      {prMessage && (
        <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">
          {prMessage}
        </div>
      )}

      {/* Session fields */}
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

      {/* NEW SET FORM, passing down the lastExerciseId */}
      <NewSetForm
        sessionId={sessionId}
        sessionCategory={session.category}
        defaultExerciseId={lastExerciseId}
        onExerciseChange={(id) => setLastExerciseId(id)}
        onCreated={handleNewSet}
      />

      {/* Sets list */}
      <section>
        <h2 className="text-xl mb-2">Sets</h2>
        {sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          <ul className="space-y-4">
            {sets.map((s) => (
              <li key={s.id} className="border p-2 rounded space-y-1">
                {/* Prefix “PR ” if this set’s hit_pr === true */}
                {s.exerciseName && (
                  <div>
                    Exercise:{" "}
                    {s.hit_pr ? "PR " + s.exerciseName : s.exerciseName}
                  </div>
                )}
                {s.rep_count != null && <div>Reps: {s.rep_count}</div>}
                {s.intensity != null && <div>Intensity: {s.intensity}</div>}
                {s.resistanceWeight != null && (
                  <div>Weight: {s.resistanceWeight}</div>
                )}
                {s.resistanceHeight != null && (
                  <div>Height: {s.resistanceHeight}</div>
                )}
                {s.set_notes && <div>Notes: {s.set_notes}</div>}
                {s.timestamp && (
                  <div className="text-sm text-gray-500">
                    {new Date(s.timestamp).toLocaleTimeString()}
                  </div>
                )}
                <button
                  onClick={() => handleDeleteSet(s.id)}
                  className="mt-1 text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SessionPage;

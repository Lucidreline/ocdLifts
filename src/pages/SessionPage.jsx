// src/pages/SessionPage.jsx
import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../firebase/firebase";

import NewSetForm from "../forms/newSetForm";

// Session categories for dropdown
const sessionCategories = ["Push", "Pull", "Legs"];

const SessionPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [sets, setSets] = useState([]);
  const [prMessage, setPrMessage] = useState("");

  // Load session data
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "sessions", sessionId));
      if (snap.exists()) {
        const data = snap.data();
        setSession({ id: snap.id, pr_hit: data.pr_hit || false, ...data });
      }
    })();
  }, [sessionId]);

  // Load sets and fetch exercise names
  useEffect(() => {
    if (!session) return;
    const ids = session.set_ids || [];
    if (ids.length === 0) {
      setSets([]);
      return;
    }
    (async () => {
      // Fetch sets
      const setQuery = query(collection(db, "sets"), where("__name__", "in", ids));
      const setSnap = await getDocs(setQuery);
      const setsData = setSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch exercise docs to get names
      const exIds = [...new Set(setsData.map(s => s.exerciseId))];
      const exMap = {};
      if (exIds.length > 0) {
        const exQuery = query(collection(db, "exercises"), where("__name__", "in", exIds));
        const exSnap = await getDocs(exQuery);
        exSnap.docs.forEach(d => {
          const { name } = d.data();
          exMap[d.id] = name;
        });
      }

      // Enrich sets with exerciseName
      const enrichedSets = setsData.map(s => ({
        ...s,
        exerciseName: exMap[s.exerciseId] || "Unknown Exercise",
      }));

      // Sort by timestamp descending
      enrichedSets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setSets(enrichedSets);
    })();
  }, [session]);

  // Generic session field updater
  const handleFieldUpdate = field => async e => {
    const value = e.target.type === "number"
      ? e.target.value === "" ? null : parseFloat(e.target.value)
      : e.target.value;
    setSession(s => ({ ...s, [field]: value }));
    await updateDoc(doc(db, "sessions", sessionId), { [field]: value });
  };

  // Add new set and detect PR
  const handleNewSet = async setId => {
    // Add set reference to session
    await updateDoc(doc(db, "sessions", sessionId), { set_ids: arrayUnion(setId) });
    setSession(s => ({ ...s, set_ids: [...(s.set_ids || []), setId] }));

    // Fetch new set data
    const setSnap = await getDoc(doc(db, "sets", setId));
    const { exerciseId, rep_count, intensity, resistanceWeight, resistanceHeight } = setSnap.data();

    // Fetch current PR from exercise
    const exSnap = await getDoc(doc(db, "exercises", exerciseId));
    const exData = exSnap.data() || {};
    const currentPr = {
      reps: exData.pr?.reps ?? 0,
      resistanceWeight: exData.pr?.resistanceWeight ?? 0,
      resistanceHeight: exData.pr?.resistanceHeight ?? 0,
    };

    // Determine PR
    const hadNoPrBefore = currentPr.reps === 0 && currentPr.resistanceWeight === 0 && currentPr.resistanceHeight === 0;
    const anyValue = rep_count > 0 || resistanceWeight > 0 || resistanceHeight > 0;
    let isPr = hadNoPrBefore && anyValue;
    if (!isPr) {
      const isWeightPr =
        resistanceWeight > currentPr.resistanceWeight &&
        rep_count === currentPr.reps &&
        resistanceHeight === currentPr.resistanceHeight;
      const isRepsPr =
        rep_count > currentPr.reps &&
        resistanceWeight === currentPr.resistanceWeight &&
        resistanceHeight === currentPr.resistanceHeight;
      const isHeightPr =
        resistanceHeight > currentPr.resistanceHeight &&
        rep_count === currentPr.reps &&
        resistanceWeight === currentPr.resistanceWeight;
      isPr = isWeightPr || isRepsPr || isHeightPr;
    }

    if (isPr) {
      const newPr = { reps: rep_count, resistanceWeight, resistanceHeight, lastUpdated: new Date().toISOString() };
      await updateDoc(doc(db, "exercises", exerciseId), { pr: newPr });
      await updateDoc(doc(db, "sessions", sessionId), { pr_hit: true });
      setSession(s => ({ ...s, pr_hit: true }));
      setPrMessage(`🎉 New PR! ${rep_count} reps, ${resistanceWeight}lbs, ${resistanceHeight} height`);
      setTimeout(() => setPrMessage(""), 5000);
    }
  };

  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl">Session: {session.category || "Uncategorized"}</h1>

      {session.pr_hit && <div className="text-green-600 font-bold">🎉 PR Hit This Session!</div>}
      {prMessage && <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">{prMessage}</div>}

      {/* Session metadata */}
      <div>
        <label className="block mb-1">Body Weight (lbs)</label>
        <input
          type="number"
          step="any"
          value={session.body_weight || ""}
          onChange={handleFieldUpdate("body_weight")}
          className="w-full p-2 border rounded"
          placeholder="e.g. 195.5"
        />
      </div>
      <div>
        <label className="block mb-1">Category</label>
        <select
          value={session.category || ""}
          onChange={handleFieldUpdate("category")}
          className="w-full p-2 border rounded"
        >
          <option value="">— select —</option>
          {sessionCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1">Notes</label>
        <textarea
          value={session.session_notes || ""}
          onChange={handleFieldUpdate("session_notes")}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      {/* New set form */}
      <NewSetForm
        sessionId={sessionId}
        sessionCategory={session.category || ""}
        onCreated={handleNewSet}
      />

      {/* Sets list */}
      <section>
        <h2 className="text-xl mb-2">Sets</h2>
        {sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          <ul className="space-y-4">
            {sets.map(s => (
              <>
                <br />
                <li key={s.id} className="border p-2 rounded">
                  {s.exerciseName && <div>Exercise: {s.exerciseName}</div>}
                  {s.rep_count != null && <div>Reps: {s.rep_count}</div>}
                  {s.intensity != 0 && <div>Intensity: {s.intensity}</div>}
                  {s.resistanceWeight != 0 && <div>Weight: {s.resistanceWeight}</div>}
                  {s.resistanceHeight != 0 && <div>Height: {s.resistanceHeight}</div>}
                  {s.set_notes && <div>Notes: {s.set_notes}</div>}
                  {s.timestamp && (
                    <div className="text-sm text-gray-500">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </li >
              </>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SessionPage;

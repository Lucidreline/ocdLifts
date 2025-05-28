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

  // Load sets belonging to this session
  useEffect(() => {
    if (!session) return;
    const ids = session.set_ids || [];
    if (ids.length === 0) {
      setSets([]);
      return;
    }
    const q = query(collection(db, "sets"), where("__name__", "in", ids));
    (async () => {
      const snap = await getDocs(q);
      setSets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [session]);

  // Generic session field updater
  const handleFieldUpdate = field => async e => {
    const value = e.target.type === "number"
      ? e.target.value === ""
        ? null
        : parseFloat(e.target.value)
      : e.target.value;
    setSession(s => ({ ...s, [field]: value }));
    await updateDoc(doc(db, "sessions", sessionId), { [field]: value });
  };

  // Add new set and detect PR
  const handleNewSet = async setId => {
    // Add set reference to session
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayUnion(setId),
    });
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
      const newPr = {
        reps: rep_count,
        resistanceWeight,
        resistanceHeight,
        lastUpdated: new Date().toISOString(),
      };
      // Update exercise PR
      await updateDoc(doc(db, "exercises", exerciseId), { pr: newPr });
      // Flag session PR
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

      {/* Sets list */}
      <section>
        <h2 className="text-xl mb-2">Sets</h2>
        {sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          <ul className="space-y-4">
            {sets.map(s => (
              <li key={s.id} className="border p-2 rounded">
                <div>Exercise: {s.exerciseId}</div>
                <div>Reps: {s.rep_count}</div>
                <div>Intensity: {s.intensity}</div>
                <div>Weight: {s.resistanceWeight}</div>
                <div>Height: {s.resistanceHeight}</div>
                <div>Notes: {s.set_notes}</div>
                <div className="text-sm text-gray-500">{new Date(s.timestamp).toLocaleTimeString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* New set form */}
      <NewSetForm
        sessionId={sessionId}
        sessionCategory={session.category || ""}
        onCreated={handleNewSet}
      />
    </div>
  );
};

export default SessionPage;

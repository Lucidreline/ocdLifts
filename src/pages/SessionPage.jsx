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

  // load session & include pr_hit flag
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "sessions", sessionId));
      if (snap.exists()) {
        const data = snap.data();
        setSession({ id: snap.id, pr_hit: data.pr_hit || false, ...data });
      }
    })();
  }, [sessionId]);

  // load its sets
  useEffect(() => {
    if (!session) return;
    const ids = session.set_ids || [];
    if (ids.length === 0) return setSets([]);
    const q = query(collection(db, "sets"), where("__name__", "in", ids));
    (async () => {
      const snap = await getDocs(q);
      setSets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [session]);

  const handleFieldUpdate = (field) => async (e) => {
    const value = e.target.type === "number"
      ? e.target.value === ""
        ? null
        : parseFloat(e.target.value)
      : e.target.value;
    setSession((s) => ({ ...s, [field]: value }));
    await updateDoc(doc(db, "sessions", sessionId), { [field]: value });
  };

  // add new set + detect PR
  const handleNewSet = async (setId) => {
    // 1) add set to session
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayUnion(setId),
    });
    setSession((s) => ({ ...s, set_ids: [...(s.set_ids || []), setId] }));

    // 2) fetch new set data
    const setSnap = await getDoc(doc(db, "sets", setId));
    const { exerciseId, rep_count, resistanceWeight, resistanceHeight } = setSnap.data();

    // 3) fetch exercise PR and coalesce null → 0
    const exSnap = await getDoc(doc(db, "exercises", exerciseId));
    const exData = exSnap.data() || {};
    const currentPr = {
      reps: exData.pr?.reps ?? 0,
      resistanceWeight: exData.pr?.resistanceWeight ?? 0,
      resistanceHeight: exData.pr?.resistanceHeight ?? 0,
    };

    // 4) debug log
    console.log("PR Check for", exerciseId, { currentPr, newSet: { rep_count, resistanceWeight, resistanceHeight } });

    // 5) detect first-ever set PR
    const hadNoPrBefore = currentPr.reps === 0 && currentPr.resistanceWeight === 0 && currentPr.resistanceHeight === 0;
    const setHasValue = rep_count > 0 || resistanceWeight > 0 || resistanceHeight > 0;
    let isPr = hadNoPrBefore && setHasValue;

    // 6) if not first-set, apply three PR rules
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

    console.log("isPr result for", exerciseId, "→", isPr);
    if (isPr) {
      // 7) update exercise PR
      const newPr = {
        reps: rep_count,
        resistanceWeight,
        resistanceHeight,
        lastUpdated: new Date().toISOString(),
      };
      console.log("Updating PR to:", newPr);
      await updateDoc(doc(db, "exercises", exerciseId), { pr: newPr });

      // 8) flag session PR hit & show message
      setSession((s) => ({ ...s, pr_hit: true }));
      await updateDoc(doc(db, "sessions", sessionId), { pr_hit: true });
      setPrMessage(`New PR for exercise ${exerciseId}: ${rep_count} reps, ${resistanceWeight} weight, ${resistanceHeight} height`);
      // clear message after 5s
      setTimeout(() => setPrMessage(''), 5000);
    }
  };

  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl">Session: {session.category || "Uncategorized"}</h1>

      {/* PR indicator & message */}
      {session.pr_hit && <div className="text-green-600 font-bold">🎉 PR Hit This Session!</div>}
      {prMessage && <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">{prMessage}</div>}

      {/* session fields */}
      <div>
        <label className="block mb-1">Body Weight (lbs)</label>
        <input
          type="number"
          step="any"
          value={session.body_weight || ""}
          placeholder="e.g. 195.5"
          onChange={handleFieldUpdate("body_weight")}
          className="w-full p-2 border rounded"
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
          {sessionCategories.map((cat) => (
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

      {/* sets list & editing as before ... */}
      <section>
        <h2 className="text-xl mb-2">Sets</h2>
        {sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          <ul className="space-y-4">
            {sets.map((s) => (
              <li
                key={s.id}
                className="border p-4 rounded cursor-pointer"
                onClick={() => setEditingSetId(s.id)}
              >
                {/* render set or edit form... */}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* new set form */}
      <NewSetForm
        sessionId={sessionId}
        sessionCategory={session.category || ""}
        onCreated={handleNewSet}
      />
    </div>
  );
};

export default SessionPage;

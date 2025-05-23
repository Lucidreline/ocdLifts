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

  // load session
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "sessions", sessionId));
      if (snap.exists()) setSession({ id: snap.id, ...snap.data() });
    })();
  }, [sessionId]);

  // load its sets
  useEffect(() => {
    if (!session) return;
    (async () => {
      if (!session.set_ids || session.set_ids.length === 0) return setSets([]);
      const q = query(
        collection(db, "sets"),
        where("__name__", "in", session.set_ids)
      );
      const snap = await getDocs(q);
      setSets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [session]);

  const handleCategoryChange = async (e) => {
    const newCat = e.target.value;
    setSession((s) => ({ ...s, category: newCat }));
    await updateDoc(doc(db, "sessions", sessionId), { category: newCat });
  };

  const handleNotesChange = async (e) => {
    const newNotes = e.target.value;
    setSession((s) => ({ ...s, session_notes: newNotes }));
    await updateDoc(doc(db, "sessions", sessionId), {
      session_notes: newNotes,
    });
  };

  // callback when a new set is created
  const handleNewSet = async (setId) => {
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayUnion(setId),
    });
    setSession((s) => ({ ...s, set_ids: [...(s.set_ids || []), setId] }));
  };

  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl">
        Session: {session.category || "Uncategorized"}
      </h1>

      {/* Category dropdown */}
      <div>
        <label className="block mb-1">Category</label>
        <select
          value={session.category || ""}
          onChange={handleCategoryChange}
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

      {/* Notes textarea */}
      <div>
        <label className="block mb-1">Notes</label>
        <textarea
          value={session.session_notes || ""}
          onChange={handleNotesChange}
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
          <ul className="space-y-2">
            {sets.map((s) => (
              <li key={s.id} className="border p-2 rounded">
                <div>Exercise: {s.exerciseId}</div>
                <div>Reps: {s.rep_count}</div>
                <div>Intensity: {s.intensity}</div>
                <div>Weight: {s.resistanceWeight}</div>
                <div>Height: {s.resistanceHeight}</div>
                <div>Notes: {s.set_notes}</div>
                <div className="text-sm text-gray-500">
                  {new Date(s.timestamp).toLocaleTimeString()}
                </div>
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

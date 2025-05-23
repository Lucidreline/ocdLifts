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
      if (session.set_ids.length === 0) return setSets([]);
      const q = query(
        collection(db, "sets"),
        where("__name__", "in", session.set_ids)
      );
      const snap = await getDocs(q);
      setSets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [session]);

  // callback when a new set is created
  const handleNewSet = async (setId) => {
    await updateDoc(doc(db, "sessions", sessionId), {
      set_ids: arrayUnion(setId),
    });
    // append locally
    setSession((s) => ({ ...s, set_ids: [...s.set_ids, setId] }));
  };

  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl">
        Session: {session.category || "Uncategorized"}
      </h1>
      <div>
        <label className="block mb-1">Category</label>
        <input
          value={session.category}
          onChange={(e) =>
            setSession((s) => ({ ...s, category: e.target.value }))
          }
          onBlur={async () => {
            await updateDoc(doc(db, "sessions", sessionId), {
              category: session.category,
            });
          }}
        />
      </div>
      <div>
        <label className="block mb-1">Notes</label>
        <textarea
          value={session.session_notes}
          onChange={(e) =>
            setSession((s) => ({ ...s, session_notes: e.target.value }))
          }
          onBlur={async () => {
            await updateDoc(doc(db, "sessions", sessionId), {
              session_notes: session.session_notes,
            });
          }}
        />
      </div>

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

      <NewSetForm sessionId={sessionId} onCreated={handleNewSet} />
    </div>
  );
};

export default SessionPage;

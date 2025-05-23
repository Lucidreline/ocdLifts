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

const sessionCategories = ["Push", "Pull", "Legs"];

const SessionPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [sets, setSets] = useState([]);
  const [editingSetId, setEditingSetId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    // Load session document
    getDoc(doc(db, "sessions", sessionId)).then((snap) => {
      if (snap.exists()) setSession({ id: snap.id, ...snap.data() });
    });
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;
    const ids = session.set_ids || [];
    if (ids.length === 0) return setSets([]);
    // Batch fetch sets
    const q = query(collection(db, "sets"), where("__name__", "in", ids));
    getDocs(q).then((snap) => {
      setSets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [session]);

  const handleFieldUpdate = (field) => async (e) => {
    const value =
      e.target.type === "number"
        ? e.target.value === ""
          ? null
          : parseFloat(e.target.value)
        : e.target.value;
    setSession((s) => ({ ...s, [field]: value }));
    await updateDoc(doc(db, "sessions", sessionId), { [field]: value });
  };

  const handleNewSet = (setId) => {
    const ref = doc(db, "sessions", sessionId);
    updateDoc(ref, { set_ids: arrayUnion(setId) });
    setSession((s) => ({ ...s, set_ids: [...(s.set_ids || []), setId] }));
  };

  // Edit handlers
  const startEdit = (set) => {
    setEditingSetId(set.id);
    setEditData({
      rep_count: set.rep_count,
      intensity: set.intensity,
      resistanceWeight: set.resistanceWeight,
      resistanceHeight: set.resistanceHeight,
      set_notes: set.set_notes,
    });
  };
  const saveEdit = async () => {
    await updateDoc(doc(db, "sets", editingSetId), editData);
    setSets((prev) =>
      prev.map((s) => (s.id === editingSetId ? { ...s, ...editData } : s))
    );
    setEditingSetId(null);
  };
  const cancelEdit = () => {
    setEditingSetId(null);
  };

  if (!session) return <p>Loading session…</p>;

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl">Session: {session.category || "—"}</h1>

      <div>
        <label className="block mb-1">Body Weight (lbs)</label>
        <input
          type="number"
          step="any"
          value={session.body_weight || ""}
          placeholder="e.g. 195"
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
            <option key={cat} value={cat}>
              {cat}
            </option>
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

      <section>
        <h2 className="text-xl mb-2">Sets</h2>
        {sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          <ul className="space-y-4">
            {sets.map((s) => (
              <li key={s.id} className="border p-4 rounded">
                {editingSetId === s.id ? (
                  <div className="space-y-2">
                    {[
                      { label: "Reps", name: "rep_count" },
                      { label: "Intensity", name: "intensity" },
                      { label: "Weight", name: "resistanceWeight" },
                      { label: "Height", name: "resistanceHeight" },
                    ].map(({ label, name }) => (
                      <input
                        key={name}
                        type="number"
                        step="any"
                        placeholder={label}
                        value={editData[name] || ""}
                        onChange={(e) =>
                          setEditData((d) => ({
                            ...d,
                            [name]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full p-2 border rounded"
                      />
                    ))}
                    <input
                      placeholder="Notes"
                      value={editData.set_notes || ""}
                      onChange={(e) =>
                        setEditData((d) => ({
                          ...d,
                          set_notes: e.target.value,
                        }))
                      }
                      className="w-full p-2 border rounded"
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => startEdit(s)}
                    className="cursor-pointer space-y-1"
                  >
                    <div>Exercise: {s.exerciseId}</div>
                    <div>Reps: {s.rep_count}</div>
                    <div>Intensity: {s.intensity}</div>
                    <div>Weight: {s.resistanceWeight}</div>
                    <div>Height: {s.resistanceHeight}</div>
                    <div>Notes: {s.set_notes}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Only ONE NewSetForm below */}
      <NewSetForm
        sessionId={sessionId}
        sessionCategory={session.category || ""}
        onCreated={handleNewSet}
      />
    </div>
  );
};

export default SessionPage;

// not to be confused with the Session (Singular) page
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../firebase/firebase";

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  // fetch sessions
  useEffect(() => {
    (async () => {
      const q = query(collection(db, "sessions"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      setSessions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    })();
  }, []);

  // create & navigate to new session
  const handleCreate = async () => {
    const payload = {
      category: "",
      session_notes: "",
      date: new Date().toISOString(),
      body_weight: null,
      set_ids: [],
    };
    const docRef = await addDoc(collection(db, "sessions"), payload);
    navigate(`/sessions/${docRef.id}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Sessions</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <p>No sessions yet. Click “Create Session” to get started.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((sess) => (
            <li key={sess.id} className="border p-3 rounded hover:bg-gray-50">
              <Link to={`/sessions/${sess.id}`} className="block">
                <div className="font-medium">
                  {sess.category || "Uncategorized"}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(sess.date).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SessionsPage;

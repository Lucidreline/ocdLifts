import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  collection,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import NewSetForm from '../forms/newSetForm';
import './SessionPage.styles.scss';

const SessionPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const sessionData = { id: docSnapshot.id, ...docSnapshot.data() };
        setSession(sessionData);

        if (sessionData.set_ids?.length > 0) {
          const fetchedSets = await Promise.all(
            sessionData.set_ids.map(async (setId) => {
              const setDoc = await getDoc(doc(db, 'sets', setId));
              if (!setDoc.exists()) return null;
              const setData = { id: setId, ...setDoc.data() };

              // Fetch exercise name
              const exDoc = await getDoc(doc(db, 'exercises', setData.exerciseId));
              const exName = exDoc.exists() ? exDoc.data().name : 'Unknown Exercise';

              // Format timestamp
              const time = new Date(setData.timestamp);
              const timeStr = time.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return {
                id: setId,
                display: `${exName}\n${setData.resistanceWeight || 0}lbs for ${setData.rep_count || 0} reps\n${timeStr}`,
              };
            })
          );
          setSets(fetchedSets.filter(Boolean));
        } else {
          setSets([]);
        }
      } else {
        setSession(null);
        setSets([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleMetadataChange = async (e) => {
    const { name, value } = e.target;
    await updateDoc(doc(db, 'sessions', sessionId), {
      [name]: name === 'bodyWeight' ? parseFloat(value) : value,
    });
  };

  if (loading) return <p>Loading…</p>;
  if (!session) return <p>Session not found.</p>;

  return (
    <div className="session-page">
      <h1 className="text-2xl font-bold mb-4">
        {session?.category || "—"}{": "}
        {session?.date
          ? new Date(session.date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric"
          })
          : "Loading..."}
      </h1>

      <div className="session-metadata">
        <label>
          Body Weight (lbs):
          <input
            type="number"
            name="bodyWeight"
            value={session.bodyWeight || ''}
            onChange={handleMetadataChange}
            placeholder="e.g. 170"
          />
        </label>

        <label>
          Category:
          <select
            name="category"
            value={session.category || ''}
            onChange={handleMetadataChange}
          >
            <option value="">Select</option>
            <option value="Push">Push</option>
            <option value="Pull">Pull</option>
            <option value="Legs">Legs</option>
          </select>
        </label>

        <label>
          Notes:
          <textarea
            name="notes"
            value={session.notes || ''}
            onChange={handleMetadataChange}
            placeholder="Any relevant notes…"
          />
        </label>
      </div>

      <NewSetForm session={session} />

      <div className="sets-list">
        <h2>Sets</h2>
        {sets.length > 0 ? (
          <ul>
            {sets.map((s) => (
              <>
                <li key={s.id} style={{ whiteSpace: "pre-line" }}>{s.display}</li>
                <br />
              </>
            ))}
          </ul>
        ) : (
          <p>No sets recorded yet.</p>
        )}
      </div>
    </div >
  );
};

export default SessionPage;

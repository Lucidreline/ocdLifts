import React, { useEffect, useState } from 'react';
import PreviousSetDisplay from "../components/PreviousSetDisplay";
import { calculatePerformanceScore } from '../utils/prUtils';

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
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'sessions', sessionId), async (docSnapshot) => {
      if (!docSnapshot.exists()) {
        setSession(null);
        setSets([]);
        setLoading(false);
        return;
      }

      const sessionData = { id: docSnapshot.id, ...docSnapshot.data() };
      setSession(sessionData);

      if (!sessionData.set_ids?.length) {
        setSets([]);
        setLoading(false);
        return;
      }

      const exerciseMap = {};
      const fetchedSets = await Promise.all(
        sessionData.set_ids.map(async (setId) => {
          const setDoc = await getDoc(doc(db, 'sets', setId));
          if (!setDoc.exists()) return null;
          const setData = { id: setId, ...setDoc.data() };

          const exDoc = await getDoc(doc(db, 'exercises', setData.exerciseId));
          const exData = exDoc.exists() ? exDoc.data() : { name: "Unknown Exercise" };

          const isBodyweight = !!exData.bodyweight_exercise;
          const bodyWeight = sessionData.bodyWeight || 0;

          const perfScore = calculatePerformanceScore(setData, bodyWeight, isBodyweight);

          const prevBest = exerciseMap[setData.exerciseId];
          const isPR =
            !prevBest ||
            perfScore > calculatePerformanceScore(prevBest.bestSet, bodyWeight, isBodyweight);

          if (!prevBest || isPR) {
            exerciseMap[setData.exerciseId] = {
              bestSet: setData,
              perfScore,
              name: exData.name,
              isBodyweight,
              prSetId: setId,
            };
          }

          const time = new Date(setData.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            id: setId,
            isPR,
            name: exData.name,
            reps: setData.rep_count || 0,
            weight: setData.resistanceWeight || 0,
            time,
          };
        })
      );

      const finalSets = fetchedSets
        .filter(Boolean)
        .map((s) => ({
          ...s,
          display: `${s.isPR ? 'PR! ' : ''}${s.name}\n${s.weight}lbs for ${s.reps} reps\n${s.time}`,
        }))
        .reverse(); // ✅ Reverse for most recent first

      setSets(finalSets);
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

      <NewSetForm
        session={session}
        onExerciseChange={(id) => setSelectedExerciseId(id)}
      />

      {selectedExerciseId && (
        <PreviousSetDisplay exerciseId={selectedExerciseId} session={session} />
      )}

      <div className="sets-list">
        <h2>Sets</h2>
        {sets.length > 0 ? (
          <ul>
            {sets.map((s) => (
              <React.Fragment key={s.id}>
                <li style={{ whiteSpace: "pre-line" }}>{s.display}</li>
                <br />
              </React.Fragment>
            ))}
          </ul>
        ) : (
          <p>No sets recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default SessionPage;

import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

const PreviousSetDisplay = ({ exerciseId, session }) => {
    const [loading, setLoading] = useState(true);
    const [prSet, setPrSet] = useState(null);
    const [recentSets, setRecentSets] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const exerciseRef = doc(db, 'exercises', exerciseId);
            const exerciseSnap = await getDoc(exerciseRef);

            if (!exerciseSnap.exists()) {
                console.warn('Exercise not found');
                setLoading(false);
                return;
            }

            const prData = exerciseSnap.data()?.pr || {};
            let prSetData = null;

            if (prData?.pr_set_id) {
                const prSetSnap = await getDoc(doc(db, 'sets', prData.pr_set_id));
                if (prSetSnap.exists()) {
                    const pr = prSetSnap.data();
                    const date = new Date(pr.timestamp);
                    const dateStr = date.toLocaleDateString();
                    prSetData = {
                        weight: pr.resistanceWeight || 0,
                        reps: pr.rep_count || 0,
                        date: dateStr,
                    };
                }
            }

            const q = query(
                collection(db, 'sets'),
                where('exerciseId', '==', exerciseId),
                orderBy('timestamp', 'desc'),
                limit(5)
            );

            const querySnapshot = await getDocs(q);
            const recent = [];
            querySnapshot.forEach((docSnap) => {
                const d = docSnap.data();
                const date = new Date(d.timestamp);
                recent.push({
                    id: docSnap.id,
                    weight: d.resistanceWeight || 0,
                    reps: d.rep_count || 0,
                    date: date.toLocaleDateString(),
                });
            });

            // Remove PR from recent if it exists
            const filteredRecent = prSetData
                ? recent.filter(
                    (s) =>
                        !(s.weight === prSetData.weight && s.reps === prSetData.reps && s.date === prSetData.date)
                )
                : recent;

            setPrSet(prSetData);
            setRecentSets(filteredRecent);
            setLoading(false);
        };

        if (exerciseId && session?.category) {
            fetchData();
        }
    }, [exerciseId, session]);

    if (loading) return <p>Loading previous data…</p>;

    return (
        <div>
            <h2 className="text-xl font-bold mt-4 mb-2">Previous Sets</h2>
            {prSet && (
                <div>
                    <span role="img" aria-label="trophy">🏆</span> <strong>PR!</strong>
                    <p>{prSet.weight} lbs × {prSet.reps} reps on {prSet.date}</p>
                </div>
            )}
            <ul className="mt-2">
                {recentSets.map((set, index) => (
                    <li key={index}>
                        {set.weight} lbs × {set.reps} reps on {set.date}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PreviousSetDisplay;

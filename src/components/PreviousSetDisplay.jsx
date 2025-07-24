import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const PreviousSetDisplay = ({ exerciseId, session }) => {
    const [prSet, setPrSet] = useState(null);
    const [recentSets, setRecentSets] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!exerciseId || !session) return;

            const [setsSnap, exerciseSnap] = await Promise.all([
                getDocs(
                    query(collection(db, 'sets'), where('exerciseId', '==', exerciseId))
                ),
                getDoc(doc(db, 'exercises', exerciseId)),
            ]);

            const allSets = setsSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(set => set.timestamp) // Ensure timestamp exists
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const prData = exerciseSnap.exists() ? exerciseSnap.data().pr : null;
            let pr = null;

            if (prData?.pr_set_id) {
                const prSetDoc = await getDoc(doc(db, 'sets', prData.pr_set_id));
                if (prSetDoc.exists()) {
                    const prSetData = prSetDoc.data();
                    pr = {
                        id: prSetDoc.id,
                        weight: prSetData.resistanceWeight || 0,
                        reps: prSetData.rep_count || 0,
                        timestamp: prSetData.timestamp,
                    };
                }
            }

            const recent5 = allSets.slice(0, 5);

            setPrSet(pr);
            setRecentSets(recent5);
        };

        fetchData();
    }, [exerciseId, session]);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mt-4">Previous Sets</h2>

            {prSet && (
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    🏆 PR!<br />
                    {prSet.weight} lbs × {prSet.reps} reps on {formatDate(prSet.timestamp)}
                </div>
            )}

            {recentSets.map((set) => (
                <div key={set.id} style={{ fontWeight: 'normal', marginBottom: '6px' }}>
                    {set.resistanceWeight || 0} lbs × {set.rep_count || 0} reps on {formatDate(set.timestamp)}
                </div>
            ))}
        </div>
    );
};

export default PreviousSetDisplay;

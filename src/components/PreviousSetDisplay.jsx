import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const PreviousSetDisplay = ({ exerciseId, session }) => {
    const [loading, setLoading] = useState(true);
    const [sets, setSets] = useState([]);
    const [pr, setPr] = useState(null);

    useEffect(() => {
        if (!exerciseId || !session?.category) return;

        const fetchPreviousSets = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, "sets"),
                    where("exerciseId", "==", exerciseId),
                    orderBy("timestamp", "desc"),
                    limit(5)
                );
                const snapshot = await getDocs(q);
                const fetchedSets = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setSets(fetchedSets);
            } catch (err) {
                console.error("Failed to fetch previous sets:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchPr = async () => {
            try {
                const exDoc = await getDoc(doc(db, "exercises", exerciseId));
                if (exDoc.exists()) {
                    const data = exDoc.data();
                    const prData = data.pr;
                    if (prData?.pr_set_id) {
                        const prSetDoc = await getDoc(doc(db, "sets", prData.pr_set_id));
                        if (prSetDoc.exists()) {
                            setPr({
                                id: prData.pr_set_id,
                                ...prSetDoc.data(),
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch PR set:", err);
            }
        };

        fetchPreviousSets();
        fetchPr();
    }, [exerciseId, session?.category]);

    const formatSet = (set, label = "") => {
        const date = new Date(set.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        return (
            <li key={set.id} style={{ whiteSpace: "pre-line" }}>
                <strong>{label}</strong>
                {`${set.resistanceWeight || 0}lbs × ${set.rep_count || 0} reps\n${dateStr} ${timeStr}`}
            </li>
        );
    };

    return (
        <div className="previous-set-display mb-6">
            <h3 className="text-lg font-semibold mb-2">Previous Data</h3>

            {loading && <p>Loading previous data…</p>}

            {!loading && sets.length === 0 && <p>No previous sets found.</p>}

            {!loading && sets.length > 0 && (
                <ul className="mb-4">
                    {sets.map((set) =>
                        pr && pr.id === set.id
                            ? formatSet(set, "🏆 PR\n")
                            : formatSet(set)
                    )}
                </ul>
            )}

            {pr && !sets.find((s) => s.id === pr.id) && (
                <ul className="mb-4">
                    {formatSet(pr, "🏆 PR\n")}
                </ul>
            )}
        </div>
    );
};

export default PreviousSetDisplay;

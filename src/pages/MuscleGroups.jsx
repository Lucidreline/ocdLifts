// src/pages/MuscleGroupsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const MuscleGroupsPage = () => {
    // 1) Grab and decode the slug from the URL
    const { groupSlug } = useParams();
    const groupName = decodeURIComponent(groupSlug);

    // 2) State hooks
    const [exercises, setExercises] = useState([]);
    const [sets, setSets] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);

    // 3) Load exercises that reference this muscle group
    useEffect(() => {
        (async () => {
            const snap = await getDocs(collection(db, 'exercises'));
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const filtered = all.filter(ex =>
                [ex.primaryMuscleGroup, ex.secondaryMuscleGroup, ex.thirdMuscleGroup]
                    .includes(groupName)
            );
            setExercises(filtered);
        })();
    }, [groupName]);

    // 4) Load sets belonging to those exercises & compute 7-day volume
    useEffect(() => {
        if (!exercises.length) return;

        (async () => {
            const snap = await getDocs(collection(db, 'sets'));
            const allSets = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // only keep sets whose exerciseId is in our filtered list
            const validIds = new Set(exercises.map(ex => ex.id));
            const filteredSets = allSets.filter(s => validIds.has(s.exerciseId));
            setSets(filteredSets);

            // build buckets for the last 7 days
            const buckets = {};
            for (let i = 6; i >= 0; i--) {
                const day = new Date();
                day.setDate(day.getDate() - i);
                buckets[day.toLocaleDateString()] = 0;
            }

            // tally one count per set (you could sum reps here instead)
            filteredSets.forEach(s => {
                if (!s.timestamp) return;
                const dayKey = new Date(s.timestamp).toLocaleDateString();
                if (buckets[dayKey] != null) {
                    buckets[dayKey]++;
                }
            });

            // transform into array for Recharts
            setWeeklyData(
                Object.entries(buckets).map(([date, count]) => ({ date, count }))
            );
        })();
    }, [exercises]);

    return (
        <div className="p-6 max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl">{groupName} Details</h1>

            {/* Exercises list */}
            <section>
                <h2 className="text-xl mb-2">Exercises</h2>
                {exercises.length === 0 ? (
                    <p>No exercises target this muscle group.</p>
                ) : (
                    <ul className="list-disc list-inside space-y-1">
                        {exercises.map(ex => (
                            <li key={ex.id}>
                                <Link to={`/exercises/${ex.id}`} className="text-blue-600 hover:underline">
                                    {ex.name} {ex.variation && `(${ex.variation})`}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* 7-day bar chart */}
            <section>
                <h2 className="text-xl mb-2">Last 7-Day Set Volume</h2>
                {weeklyData.length === 0 ? (
                    <p>No sets recorded in the last week.</p>
                ) : (
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={weeklyData} margin={{ top: 10, right: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" name="Sets" fill="#4A90E2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            {/* Raw sets list */}
            <section>
                <h2 className="text-xl mb-2">All Recent Sets</h2>
                {sets.length === 0 ? (
                    <p>No sets to display.</p>
                ) : (
                    <ul className="space-y-2">
                        {sets.map(s => {
                            const ex = exercises.find(e => e.id === s.exerciseId) || {};
                            return (
                                <li key={s.id} className="border p-2 rounded">
                                    <div className="text-sm text-gray-500">
                                        {new Date(s.timestamp).toLocaleString()}
                                    </div>
                                    <div>Exercise: {ex.name}</div>
                                    <div>Reps: {s.rep_count}</div>
                                    <div>Weight: {s.resistanceWeight}</div>
                                    {s.set_notes && <div>Notes: {s.set_notes}</div>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default MuscleGroupsPage;

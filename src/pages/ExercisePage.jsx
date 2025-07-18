// src/pages/ExercisePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import NewExercisesForm from '../forms/newExerciseForm';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';

const ExercisePage = () => {
    const { exerciseId } = useParams();
    const navigate = useNavigate();

    const [exercise, setExercise] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [sets, setSets] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1) Load the exercise doc
    useEffect(() => {
        if (!exerciseId) {
            setLoading(false);
            return;
        }
        const fetch = async () => {
            try {
                const snap = await getDoc(doc(db, 'exercises', exerciseId));
                if (snap.exists()) {
                    setExercise({ id: snap.id, ...snap.data() });
                } else {
                    console.warn('Exercise not found:', exerciseId);
                }
            } catch (err) {
                console.error('Error fetching exercise:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [exerciseId]);

    // 2) Load sets once exercise is loaded
    useEffect(() => {
        if (!exercise) return;
        const fetchSets = async () => {
            try {
                const q = query(
                    collection(db, 'sets'),
                    where('exerciseId', '==', exerciseId)
                );
                const snap = await getDocs(q);
                const allSets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setSets(allSets);

                const buckets = {};
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    buckets[d.toLocaleDateString()] = 0;
                }
                allSets.forEach(s => {
                    const ts = s.timestamp;
                    if (!ts) return;
                    const key = new Date(ts).toLocaleDateString();
                    if (buckets[key] != null) buckets[key]++;
                });
                setChartData(
                    Object.entries(buckets).map(([date, count]) => ({ date, count }))
                );
            } catch (err) {
                console.error('Error fetching sets:', err);
            }
        };
        fetchSets();
    }, [exercise, exerciseId]);

    // Handlers
    const handleDelete = async () => {
        if (window.confirm('Really delete this exercise?')) {
            await deleteDoc(doc(db, 'exercises', exerciseId));
            navigate('/exercises');
        }
    };

    const handleResetPr = async () => {
        const now = new Date().toISOString();
        const pr = { reps: null, resistanceWeight: null, resistanceHeight: null, lastUpdated: now };
        await updateDoc(doc(db, 'exercises', exerciseId), { pr });
        setExercise(ex => ({ ...ex, pr }));
    };

    const handleSave = async updated => {
        await updateDoc(doc(db, 'exercises', exerciseId), updated);
        setEditMode(false);
        const snap = await getDoc(doc(db, 'exercises', exerciseId));
        setExercise({ id: snap.id, ...snap.data() });
    };

    if (loading) return <p>Loading…</p>;
    if (!exercise) return <p>Exercise not found.</p>;

    // Destructure safely
    const {
        name = '',
        variation = '',
        category = '',
        primaryMuscleGroup = '',
        secondaryMuscleGroup = '',
        thirdMuscleGroup = '',
        pr = {},
    } = exercise;
    const prReps = pr.reps ?? '';
    const prWeight = pr.resistanceWeight ?? '';
    const prHeight = pr.resistanceHeight ?? '';
    const prUpdated = pr.lastUpdated ?? '';
    const hasPr = prReps !== '' || prWeight !== '' || prHeight !== '';

    return (
        <div className="p-6 max-w-xl mx-auto space-y-6">
            {/* Header */}
            <h1 className="text-2xl">
                {name}{variation && ` (${variation})`}
            </h1>
            <div>Category: {category}</div>
            <div>Primary Muscle: {primaryMuscleGroup}</div>
            {secondaryMuscleGroup && <div>Secondary: {secondaryMuscleGroup}</div>}
            {thirdMuscleGroup && <div>Third: {thirdMuscleGroup}</div>}

            {/* PR */}
            <div className="mt-2 p-4 bg-gray-100 rounded">
                <strong>PR:</strong> {hasPr ? `${prReps} reps, ${prWeight}lbs, height ${prHeight}` : 'None'}
                {prUpdated && (
                    <div className="text-sm text-gray-600">
                        Last updated: {new Date(prUpdated).toLocaleString()}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="space-x-2">
                <button onClick={() => setEditMode(!editMode)} className="px-3 py-1 bg-blue-600 text-white rounded">
                    {editMode ? 'Cancel' : 'Edit'}
                </button>
                <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">
                    Delete
                </button>
                <button onClick={handleResetPr} className="px-3 py-1 bg-yellow-500 text-white rounded">
                    Reset PR
                </button>
            </div>

            {/* Edit Form */}
            {editMode && (
                <div className="mt-4 border p-4 rounded bg-gray-50">
                    <NewExercisesForm initialData={exercise} onSubmit={handleSave} />
                </div>
            )}

            {/* Usage Chart */}
            <section>
                <h2 className="text-xl mb-2">Sets in Last 7 Days</h2>
                {chartData.every(d => d.count === 0) ? (
                    <p className="text-gray-500">No recent sets.</p>
                ) : (
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" name="Sets" fill="#4A90E2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            {/* All Sets List */}
            <section>
                <h2 className="text-xl mb-2">All Sets</h2>
                {sets.length === 0 ? (
                    <p className="text-gray-500">No sets logged.</p>
                ) : (
                    <ul className="space-y-1">
                        {sets.map(s => {
                            const dateStr = s.timestamp ? new Date(s.timestamp).toLocaleString() : '';
                            const reps = s.rep_count ?? '';
                            const weight = s.resistanceWeight ?? '';
                            const notes = s.set_notes ?? '';
                            return (
                                <li key={s.id} className="text-sm">
                                    {dateStr}{reps && `: ${reps} reps`}{weight && ` @ ${weight}lbs`}{notes && ` — ${notes}`}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default ExercisePage;

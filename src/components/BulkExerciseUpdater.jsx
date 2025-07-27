// src/components/BulkExerciseUpdater.jsx

import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const BulkExerciseUpdater = () => {
    const [parsedRows, setParsedRows] = useState([]);
    const [previewRows, setPreviewRows] = useState([]);
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState({ total: 0, updated: 0 });
    const [confirmed, setConfirmed] = useState(false);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus('Parsing CSV...');
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const parsed = results.data;
                setParsedRows(parsed);
                setPreviewRows(parsed.slice(0, 10)); // Preview first 10 rows
                setStatus(`Parsed ${parsed.length} exercises. Please confirm to proceed.`);
                setConfirmed(false);
            },
        });
    };

    const handleConfirmUpdate = async () => {
        setStatus('Fetching existing exercises...');

        const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
        const exerciseMap = {};
        exercisesSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            exerciseMap[data.name] = docSnap.id;
        });

        setStatus('Updating exercises...');
        let updatedCount = 0;

        for (const row of parsedRows) {
            const { name, muscleGroup, secondaryMuscleGroup, thirdMuscleGroup } = row;
            const docId = exerciseMap[name];
            if (!docId) {
                console.warn(`Exercise not found: ${name}`);
                continue;
            }

            try {
                await updateDoc(doc(db, 'exercises', docId), {
                    muscleGroup: muscleGroup || '',
                    secondaryMuscleGroup: secondaryMuscleGroup || '',
                    thirdMuscleGroup: thirdMuscleGroup || '',
                });
                updatedCount++;
                setProgress({ total: parsedRows.length, updated: updatedCount });
            } catch (error) {
                console.error(`Failed to update ${name}:`, error);
            }
        }

        setStatus('Update complete!');
        setConfirmed(true);
    };

    return (
        <div className="bulk-exercise-updater">
            <h2 className="text-xl font-semibold mb-2">Bulk Update Exercises (CSV)</h2>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-4" />
            <p className="mb-2">{status}</p>

            {previewRows.length > 0 && !confirmed && (
                <>
                    <h3 className="font-medium mb-1">Preview (first 10 rows)</h3>
                    <table className="table-auto text-sm border mb-4">
                        <thead>
                            <tr>
                                <th className="border px-2 py-1">Name</th>
                                <th className="border px-2 py-1">Primary</th>
                                <th className="border px-2 py-1">Secondary</th>
                                <th className="border px-2 py-1">Third</th>
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((row, i) => (
                                <tr key={i}>
                                    <td className="border px-2 py-1">{row.name}</td>
                                    <td className="border px-2 py-1">{row.muscleGroup}</td>
                                    <td className="border px-2 py-1">{row.secondaryMuscleGroup}</td>
                                    <td className="border px-2 py-1">{row.thirdMuscleGroup}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={handleConfirmUpdate}
                    >
                        Confirm and Update
                    </button>
                </>
            )}

            {progress.updated > 0 && (
                <p>
                    Updated {progress.updated} of {progress.total} exercises
                </p>
            )}
        </div>
    );
};

export default BulkExerciseUpdater;

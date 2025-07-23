// src/components/SessionMuscleChart.jsx
import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    Timestamp,
} from "firebase/firestore";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { db } from "../firebase/firebase";

const SessionMuscleChart = ({ category, refreshKey = 0 }) => {
    const [chartData, setChartData] = useState([]);
    const [metric, setMetric] = useState("sets");

    useEffect(() => {
        if (!category) return;

        const fetchData = async () => {
            const exSnap = await getDocs(collection(db, "exercises"));
            const exMap = {};
            exSnap.docs.forEach((doc) => {
                const data = doc.data();
                exMap[doc.id] = {
                    category: data.category,
                    primary: data.primaryMuscleGroup,
                    secondary: data.secondaryMuscleGroup,
                    third: data.thirdMuscleGroup,
                };
            });

            const setSnap = await getDocs(collection(db, "sets"));
            const sets = setSnap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((s) => {
                    const t = s.timestamp?.toDate?.() || new Date(s.timestamp);
                    return (
                        t &&
                        new Date() - t <= 7 * 24 * 60 * 60 * 1000 // last 7 days
                    );
                });

            const muscleMap = {};

            sets.forEach((s) => {
                const ex = exMap[s.exerciseId];
                if (!ex || ex.category !== category) return;

                const val = metric === "sets" ? 1 : s.rep_count || 0;

                for (const [level, key] of [
                    ["primary", ex.primary],
                    ["secondary", ex.secondary],
                    ["third", ex.third],
                ]) {
                    if (!key) continue;
                    if (!muscleMap[key]) muscleMap[key] = { primary: 0, secondary: 0, third: 0 };
                    muscleMap[key][level] += val;
                }
            });

            const chartReady = Object.entries(muscleMap).map(([group, val]) => ({
                group,
                primary: val.primary,
                secondary: val.secondary,
                third: val.third,
            }));

            setChartData(chartReady);
        };

        fetchData();
    }, [category, metric, refreshKey]);

    return (
        <div className="my-6">
            <div className="flex items-center gap-4 mb-2">
                <label className="font-semibold">Metric:</label>
                <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="p-1 border rounded"
                >
                    <option value="sets">Sets</option>
                    <option value="reps">Reps</option>
                </select>
            </div>

            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="group" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="primary" stackId="a" fill="#8884d8" />
                        <Bar dataKey="secondary" stackId="a" fill="#82ca9d" />
                        <Bar dataKey="third" stackId="a" fill="#ffc658" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SessionMuscleChart;

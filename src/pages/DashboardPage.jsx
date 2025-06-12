// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const DashboardPage = () => {
  const [exercisesMap, setExercisesMap] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [metricFilter, setMetricFilter] = useState("sets");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const [chartData, setChartData] = useState([]);

  // Fetch all exercises once
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "exercises"));
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = data;
      });
      setExercisesMap(map);
    })();
  }, []);

  // Recompute chart data whenever filters or exercisesMap change
  useEffect(() => {
    if (!Object.keys(exercisesMap).length) return;

    (async () => {
      // Fetch all sets
      const snap = await getDocs(collection(db, "sets"));
      const sets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const start = new Date(startDate);
      // Count by muscle group
      const counts = {};
      sets.forEach((s) => {
        if (!s.timestamp) return;
        const t = new Date(s.timestamp);
        if (t < start) return;

        const ex = exercisesMap[s.exerciseId];
        if (!ex) return;
        if (categoryFilter !== "All" && ex.category !== categoryFilter) return;

        const groups = [
          ex.primaryMuscleGroup,
          ex.secondaryMuscleGroup,
          ex.thirdMuscleGroup
        ].filter(Boolean);
        groups.forEach((group) => {
          const val = metricFilter === "sets" ? 1 : s.rep_count || 0;
          counts[group] = (counts[group] || 0) + val;
        });
      });

      // Transform to array
      const data = Object.entries(counts).map(([group, value]) => ({ group, value }));
      setChartData(data);
    })();
  }, [exercisesMap, categoryFilter, metricFilter, startDate]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Workout Volume Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block mb-1">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option>All</option>
            <option>Push</option>
            <option>Pull</option>
            <option>Legs</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Metric:</label>
          <select
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="sets">Sets</option>
            <option value="reps">Reps</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="group" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#4A90E2" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardPage;

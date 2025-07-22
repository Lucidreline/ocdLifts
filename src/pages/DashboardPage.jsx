// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [exercisesMap, setExercisesMap] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [metricFilter, setMetricFilter] = useState("sets");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]
  );
  const [chartData, setChartData] = useState([]);

  // Fetch exercises
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "exercises"));
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = {
          category: d.data().category,
          primary: d.data().primaryMuscleGroup,
          secondary: d.data().secondaryMuscleGroup,
          third: d.data().thirdMuscleGroup,
        };
      });
      setExercisesMap(map);
    })();
  }, []);

  // Compute chart data
  useEffect(() => {
    if (!Object.keys(exercisesMap).length) return;

    (async () => {
      const snap = await getDocs(collection(db, "sets"));
      const sets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const start = new Date(startDate);
      const counts = {};

      sets.forEach((s) => {
        if (!s.timestamp) return;
        const t = new Date(s.timestamp);
        if (t < start) return;

        const ex = exercisesMap[s.exerciseId];
        if (!ex) return;
        if (categoryFilter !== "All" && ex.category !== categoryFilter) return;

        const val = metricFilter === "sets" ? 1 : s.rep_count || 0;

        // primary
        if (ex.primary) {
          if (!counts[ex.primary]) counts[ex.primary] = { primary: 0, secondary: 0, third: 0 };
          counts[ex.primary].primary += val;
        }
        // secondary
        if (ex.secondary) {
          if (!counts[ex.secondary]) counts[ex.secondary] = { primary: 0, secondary: 0, third: 0 };
          counts[ex.secondary].secondary += val;
        }
        // third
        if (ex.third) {
          if (!counts[ex.third]) counts[ex.third] = { primary: 0, secondary: 0, third: 0 };
          counts[ex.third].third += val;
        }
      });

      const data = Object.entries(counts).map(([group, vals]) => ({
        group,
        primary: vals.primary,
        secondary: vals.secondary,
        third: vals.third,
      }));

      setChartData(data);
    })();
  }, [exercisesMap, categoryFilter, metricFilter, startDate]);

  // Handle bar click
  const handleBarClick = (data) => {
    const grp = data.group;
    navigate(`/muscle-groups/${encodeURIComponent(grp)}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">test test 123! Workout Volume Dashboard</h1>

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

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onClick={({ activePayload }) => {
              if (activePayload && activePayload.length) {
                handleBarClick(activePayload[0].payload);
              }
            }}
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

export default DashboardPage;

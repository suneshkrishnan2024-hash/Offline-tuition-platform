import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

function ClassPage() {
  const { id } = useParams();

  const [marks, setMarks] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      console.log("CLASS ID:", id);

      // 🔥 FETCH CLASS
      const classRes = await fetch(
        `http://localhost:5000/api/class/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const classJson = await classRes.json();
      setClassData(classJson.class);

      // 🔥 FETCH MARKS (CORRECT ENDPOINT)
      const res = await fetch(
        `http://localhost:5000/api/marks/class/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      console.log("REAL MARKS DATA:", data);

      // ✅🔥 THIS IS THE FIX
      setMarks(data.marks || []);

    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 GRAPH
  const chartData = {
  labels: marks.map((m) => m.testName),
  datasets: [
    {
      label: "Marks",
      data: marks.map((m) => m.marksObtained),
      borderColor: "#6366f1",
      backgroundColor: "rgba(99,102,241,0.3)",
      fill: true,
      tension: 0.4,
      pointRadius: 5,
    },
  ],
};

  const options = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  // 🔥 AVG FIX
  const avg =
    marks.length > 0
      ? (
          marks.reduce((sum, m) => sum + m.marksObtained, 0) /
          marks.length
        ).toFixed(2)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <div className="glass p-6">

        {/* CLASS NAME */}
        <h2 className="text-2xl font-bold mb-1">
          {classData?.title || "Class"} 📚
        </h2>

        <p className="text-gray-600 mb-4">
          {classData?.subject}
        </p>

        <h3 className="text-xl font-semibold mb-4">
          Performance 📊
        </h3>

        {/* BUTTON */}
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="btn-primary mb-4"
        >
          {showGraph ? "Hide Graph" : "Show Graph"}
        </button>

        {/* EMPTY STATE */}
        {marks.length === 0 && (
          <div className="p-4 bg-yellow-100 text-yellow-700 rounded mb-4">
            No tests added for this class yet 🚀
          </div>
        )}

        {/* GRAPH */}
        {showGraph && marks.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow">
            <Line data={chartData} options={options} />
          </div>
        )}

        {/* AVG */}
        <div className="mt-4 p-4 bg-indigo-100 rounded-xl text-center">
          <p className="text-lg font-semibold text-indigo-700">
            Average Score
          </p>
          <p className="text-2xl font-bold text-indigo-900">
            {avg !== null ? avg : "—"}
          </p>
        </div>

        {/* MARKS LIST */}
        <div className="mt-6">
          {marks.length === 0 ? (
            <p className="text-gray-500 italic">No marks available</p>
          ) : (
            marks.map((m) => (
              <div
                key={m._id}
                className="p-3 bg-white shadow rounded-lg mt-2"
              >
                {m.testName} —{" "}
                <span className="text-indigo-600 font-semibold">
                  {m.marksObtained}/{m.totalMarks}
                </span>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}

export default ClassPage;
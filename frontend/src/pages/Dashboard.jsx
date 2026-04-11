import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase().trim();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalClasses: 0,
    avgMarks: 0,
    totalTests: 0,
    bestScore: 0,
  });

  const [classes, setClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [pending, setPending] = useState([]);
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [form, setForm] = useState({
    title: "",
    subject: "",
    monthlyFee: "",
  });

  const [marksForm, setMarksForm] = useState({
    studentId: "",
    testName: "",
    marksObtained: "",
    totalMarks: "",
  });

  // ================= FETCH =================

  const fetchClasses = async () => {
    const res = await fetch("http://localhost:5000/api/class/my", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    setClasses(data.classes || []);
  };

  const fetchAllClasses = async () => {
    const res = await fetch("http://localhost:5000/api/class/all", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    setAllClasses(data.classes || []);
  };

  const fetchStats = async () => {
    const res = await fetch("http://localhost:5000/api/marks/my", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();
    const marks = data.marks || [];

    const totalTests = marks.length;

    const avgMarks =
      totalTests > 0
        ? (
            marks.reduce((sum, m) => sum + m.marksObtained, 0) /
            totalTests
          ).toFixed(2)
        : 0;

    const bestScore =
      totalTests > 0
        ? Math.max(...marks.map((m) => m.marksObtained))
        : 0;

    setStats({
      totalClasses: classes.length,
      avgMarks,
      totalTests,
      bestScore,
    });
  };

  useEffect(() => {
    fetchClasses();
    fetchAllClasses();
    fetchStats();
  }, []);

  // ================= JOIN =================

  const handleJoinClass = async (classId) => {
    const res = await fetch(
      `http://localhost:5000/api/class/join/${classId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();
    alert(data.message);

    fetchClasses();
    fetchAllClasses();
  };

  // ================= SELECT CLASS =================

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls);

    const res = await fetch(
      `http://localhost:5000/api/class/${cls._id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    setPending(data.pendingStudents || []);
    setStudents(data.students || []);
    setDocuments(data.class?.documents || []);

    if (role === "teacher") {
      const qrRes = await fetch(
        `http://localhost:5000/api/class/qr/${cls._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const qrData = await qrRes.json();
      setQrCode(qrData.qr);
    }
  };

  // ================= CREATE =================

  const handleCreate = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:5000/api/class/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    setForm({ title: "", subject: "", monthlyFee: "" });
    fetchClasses();
  };

  // ================= APPROVE =================

  const handleApprove = async (studentId) => {
    await fetch(
      `http://localhost:5000/api/class/approve/${selectedClass._id}/${studentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    handleSelectClass(selectedClass);
  };

  // ================= MARKS =================

  const handleSubmitMarks = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:5000/api/marks/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        ...marksForm,
        classId: selectedClass._id,
      }),
    });

    alert("Marks uploaded ✅");

    setMarksForm({
      studentId: "",
      testName: "",
      marksObtained: "",
      totalMarks: "",
    });
  };

  // ================= FILE =================

  const handleUploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("classId", selectedClass._id);

    await fetch("http://localhost:5000/api/class/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    alert("File uploaded 📁");
    handleSelectClass(selectedClass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      {/* HEADER */}
      <div className="glass p-4 flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome {user?.name} 👋
        </h2>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
          className="btn-danger"
        >
          Logout
        </button>
      </div>

      {/* ================= STUDENT ================= */}
      {role === "student" && (
        <div className="glass p-6 max-w-md">

          {/* STATS */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass p-4 text-center">
              <p>Classes</p>
              <h2>{stats.totalClasses}</h2>
            </div>

            <div className="glass p-4 text-center">
              <p>Average</p>
              <h2>{stats.avgMarks}</h2>
            </div>

            <div className="glass p-4 text-center">
              <p>Tests</p>
              <h2>{stats.totalTests}</h2>
            </div>

            <div className="glass p-4 text-center">
              <p>Best</p>
              <h2>{stats.bestScore}</h2>
            </div>
          </div>

          {/* AVAILABLE CLASSES */}
          <h3 className="mb-3">Available Classes 🎓</h3>

          {allClasses
            .filter((cls) => !classes.some((c) => c._id === cls._id))
            .map((cls) => (
              <div key={cls._id} className="flex justify-between p-2 bg-white mb-2 rounded">
                <span>{cls.title}</span>

                <button onClick={() => handleJoinClass(cls._id)} className="btn-primary">
                  Join
                </button>
              </div>
            ))}

          {/* MY CLASSES */}
          <h3 className="mt-4 mb-3">My Classes</h3>

          {classes.map((cls) => (
            <div
              key={cls._id}
              onClick={() => navigate(`/class/${cls._id}`)}
              className="p-3 bg-purple-500 text-white rounded mt-2 cursor-pointer"
            >
              {cls.title}
            </div>
          ))}
        </div>
      )}

      {/* ================= TEACHER ================= */}
      {role === "teacher" && (
        <div className="grid grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="glass p-5">

            <h3 className="font-semibold mb-3">My Classes</h3>

            {classes.map((cls) => (
              <div
                key={cls._id}
                onClick={() => handleSelectClass(cls)}
                className="p-2 bg-gray-100 mb-2 cursor-pointer"
              >
                {cls.title}
              </div>
            ))}

            <form onSubmit={handleCreate} className="mt-4 space-y-2">
              <input className="input" placeholder="Title"
                value={form.title}
                onChange={(e)=>setForm({...form,title:e.target.value})}
              />
              <input className="input" placeholder="Subject"
                value={form.subject}
                onChange={(e)=>setForm({...form,subject:e.target.value})}
              />
              <input className="input" placeholder="Fee"
                value={form.monthlyFee}
                onChange={(e)=>setForm({...form,monthlyFee:e.target.value})}
              />
              <button className="btn-primary w-full">Create</button>
            </form>

          </div>

          {/* RIGHT */}
          <div className="col-span-2 glass p-6">

            {!selectedClass ? (
              <p>Select a class</p>
            ) : (
              <>
                <h2 className="mb-3">{selectedClass.title}</h2>

                <img src={qrCode} className="w-40 mb-4" />

                {/* MARKS */}
                <form onSubmit={handleSubmitMarks} className="space-y-2">

                  <select
                    className="input"
                    value={marksForm.studentId}
                    onChange={(e)=>setMarksForm({...marksForm,studentId:e.target.value})}
                  >
                    <option>Select Student</option>
                    {students.map((s)=>(
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>

                  <input className="input" placeholder="Test"
                    value={marksForm.testName}
                    onChange={(e)=>setMarksForm({...marksForm,testName:e.target.value})}
                  />

                  <input className="input" placeholder="Marks"
                    value={marksForm.marksObtained}
                    onChange={(e)=>setMarksForm({...marksForm,marksObtained:e.target.value})}
                  />

                  <input className="input" placeholder="Total"
                    value={marksForm.totalMarks}
                    onChange={(e)=>setMarksForm({...marksForm,totalMarks:e.target.value})}
                  />

                  <button className="btn-primary w-full">Upload</button>
                </form>

                {/* FILE */}
                <input type="file" className="mt-4"
                  onChange={(e)=>handleUploadFile(e.target.files[0])}
                />

                {/* PENDING */}
                <div className="mt-4">
                  <h4>Pending</h4>

                  {pending.map((p)=>(
                    <div key={p._id} className="flex justify-between">
                      {p.name}
                      <button onClick={()=>handleApprove(p._id)} className="btn-success">
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>

        </div>
      )}
    </div>
  );
}

export default Dashboard;
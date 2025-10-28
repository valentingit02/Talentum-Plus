import { useState } from "react";

export default function SkillForm() {
  const [nombre, setNombre] = useState("");
  const [skill, setSkill] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const skillsDisponibles = [
    "python", "java", "javascript", "react", "angular", "docker",
    "kubernetes", "sql", "mongodb", "cassandra", "neo4j",
    "nodejs", "html", "css", "aws", "azure", "gcp", "otro"
  ];

  const agregarSkill = async () => {
    if (!nombre.trim() || !skill) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setMsg("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/skills/add?user_name=${nombre.trim().toLowerCase()}&skill=${skill.toLowerCase()}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setMsg(data.message || "Skill agregada correctamente ✅");

      setNombre("");
      setSkill("");
    } catch (err) {
      console.error("Error al agregar skill:", err);
      setError("No se pudo agregar el skill.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Agregar Skill a Usuario</h2>

      <div className="flex flex-col gap-4 mb-4">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Usuario"
          className="border p-2 rounded"
        />

        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Selecciona un skill...</option>
          {skillsDisponibles.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <button
        onClick={agregarSkill}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        Agregar Skill
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}
      {msg && <p className="text-green-600 mt-3">{msg}</p>}
    </div>
  );
}

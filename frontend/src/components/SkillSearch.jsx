import { useState } from "react";

export default function SkillSearch() {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [msg, setMsg] = useState("");

  const skillsDisponibles = [
    "python", "java", "javascript", "react", "angular", "docker",
    "kubernetes", "sql", "mongodb", "cassandra", "neo4j",
    "nodejs", "html", "css", "aws", "azure", "gcp"
  ];

  const handleCheckboxChange = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/skills/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: selectedSkills }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      if (data.usuarios) {
        setUsuarios(data.usuarios);
        setMsg(
          data.usuarios.length
            ? `Usuarios encontrados: ${data.usuarios.length}`
            : "No se encontraron usuarios con esos skills."
        );
      } else {
        setMsg(data.message || "Hubo un error al obtener los usuarios.");
      }
    } catch (error) {
      console.error("Error al buscar usuarios:", error);
      setMsg("Error al buscar usuarios por skills.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Segmentar Usuarios por Skills</h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {skillsDisponibles.map((s, i) => (
            <label key={i} className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={selectedSkills.includes(s)}
                onChange={() => handleCheckboxChange(s)}
                className="accent-blue-600"
              />
              {s}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded shadow hover:bg-blue-700"
        >
          Buscar
        </button>
      </form>

      {msg && <p className="text-gray-700 mb-4">{msg}</p>}

      {usuarios.length > 0 && (
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-300 w-full bg-white shadow-sm rounded">
            <thead>
              <tr className="bg-gray-200 text-sm">
                <th className="border border-gray-300 px-3 py-2 text-left">Usuario</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Skills encontrados</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 font-medium">{u.nombre}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-700">{u.skills.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

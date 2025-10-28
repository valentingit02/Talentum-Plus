import { useState } from "react";
import { postData } from "../api";

export default function PositionForm() {
  const [form, setForm] = useState({
    titulo: "",
    empresa: "",
    experiencia_requerida: "",
    estudios_requeridos: "",
    skills_requeridos: "",
  });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const skillsList = form.skills_requeridos
      ? [form.skills_requeridos.toLowerCase()]
      : [];
    const res = await postData("/api/positions", {
      ...form,
      skills_requeridos: skillsList,
    });
    setMsg(res.message || JSON.stringify(res));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Nueva Posición</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          name="titulo"
          placeholder="Título del puesto"
          onChange={handleChange}
          required
        />
        <input
          name="empresa"
          placeholder="Nombre de la empresa"
          onChange={handleChange}
          required
        />

        {/* Experiencia */}
        <label className="font-medium text-gray-700">Experiencia requerida</label>
        <select name="experiencia_requerida" onChange={handleChange}>
          <option value="">Selecciona años</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2-3">2-3</option>
          <option value="4-5">4-5</option>
          <option value="6+">6+</option>
        </select>

        {/* Estudios */}
        <label className="font-medium text-gray-700">Estudios requeridos</label>
        <select name="estudios_requeridos" onChange={handleChange}>
          <option value="">Selecciona</option>
          <option value="secundario">Secundario</option>
          <option value="terciario">Terciario</option>
          <option value="universitario">Universitario</option>
          <option value="posgrado">Posgrado</option>
        </select>

        {/* Skills */}
        <label className="font-medium text-gray-700">Skills requeridos</label>
        <select name="skills_requeridos" onChange={handleChange}>
          <option value="">Selecciona un skill</option>
          <option value="python">Python</option>
          <option value="react">React</option>
          <option value="java">Java</option>
          <option value="sql">SQL</option>
          <option value="docker">Docker</option>
          <option value="nodejs">NodeJS</option>
          <option value="otro">Otro</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Crear Posición
        </button>
      </form>
      {msg && <p className="text-green-600 mt-3">{msg}</p>}
    </div>
  );
}

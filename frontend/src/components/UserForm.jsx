import { useState } from "react";
import { postData } from "../api";

export default function UserForm() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    skills: "",
    estudios: "",
    experiencia: "",
    trabajoAnterior: "",
  });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await postData("/api/users", {
      ...form,
      skills: form.skills ? [form.skills.toLowerCase()] : []
    });
    setMsg(res.message || JSON.stringify(res));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Usuario</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        
        <input name="nombre" placeholder="Nombre" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} required />

        {/* Skills */}
        <label className="font-medium text-gray-700">Skills</label>
        <select name="skills" onChange={handleChange}>
          <option value="">Selecciona un skill</option>
          <option value="python">Python</option>
          <option value="react">React</option>
          <option value="java">Java</option>
          <option value="sql">SQL</option>
          <option value="docker">Docker</option>
          <option value="otro">Otro</option>
        </select>

        {/* Estudios */}
        <label className="font-medium text-gray-700">Estudios</label>
        <select name="estudios" onChange={handleChange}>
          <option value="">Selecciona un estudio</option>
          <option value="secundario">Secundario</option>
          <option value="terciario">Terciario</option>
          <option value="universitario">Universitario</option>
          <option value="posgrado">Posgrado</option>
        </select>

        {/* Experiencia */}
        <label className="font-medium text-gray-700">Años de experiencia</label>
        <select name="experiencia" onChange={handleChange}>
          <option value="">Selecciona años</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2-3">2-3</option>
          <option value="4-5">4-5</option>
          <option value="6+">6+</option>
        </select>

        {/* Trabajo anterior */}
        <label className="font-medium text-gray-700">Trabajo anterior</label>
        <select name="trabajoAnterior" onChange={handleChange}>
          <option value="">Selecciona</option>
          <option value="desarrollador">Desarrollador</option>
          <option value="analista">Analista</option>
          <option value="qa">QA Tester</option>
          <option value="pm">Project Manager</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          Crear Usuario
        </button>
      </form>
      {msg && <p className="text-green-600 mt-3">{msg}</p>}
    </div>
  );
}

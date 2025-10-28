import { useState } from "react";

export default function CapacitacionForm() {
  const [nombre, setNombre] = useState("");
  const [capacitacion, setCapacitacion] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const agregarCapacitacion = async () => {
    if (!nombre.trim() || !capacitacion.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setMsg("");

    try {
      const res = await fetch("http://localhost:8000/api/users/capacitacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim().toLowerCase(),
          capacitacion: capacitacion.trim(),
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setMsg(data.message || "Capacitación agregada correctamente ✅");
      setNombre("");
      setCapacitacion("");
    } catch (err) {
      console.error("Error al agregar capacitación:", err);
      setError("No se pudo agregar la capacitación.");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Agregar Capacitación</h2>

      <div className="flex flex-col gap-4 mb-4">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Usuario"
          className="border p-2 rounded"
        />
        <input
          value={capacitacion}
          onChange={(e) => setCapacitacion(e.target.value)}
          placeholder="Capacitación"
          className="border p-2 rounded"
        />
      </div>

      <button
        onClick={agregarCapacitacion}
        className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
      >
        Agregar
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}
      {msg && <p className="text-green-600 mt-3">{msg}</p>}
    </div>
  );
}

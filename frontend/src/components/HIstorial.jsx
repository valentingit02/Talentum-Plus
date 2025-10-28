import { useState } from "react";

export default function Historial() {
  const [nombreInput, setNombreInput] = useState("");
  const [nombre, setNombre] = useState("");
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscarHistorial = async () => {
    if (!nombreInput.trim()) return;
    setNombre(nombreInput.trim().toLowerCase());

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:8000/api/dashboard/user/${encodeURIComponent(
          nombreInput.trim().toLowerCase()
        )}`
      );
      if (!res.ok) throw new Error("Error al traer historial");
      const data = await res.json();
      setHistorial(data.historial || []);
    } catch {
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📜 Historial de Cambios</h2>

      <div className="flex gap-2 mb-6">
        <input
          value={nombreInput}
          onChange={(e) => setNombreInput(e.target.value)}
          placeholder="Usuario..."
          className="border p-2 rounded w-full"
        />
        <button
          onClick={buscarHistorial}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Buscar
        </button>
      </div>

      {!nombre ? (
        <p className="text-gray-600">Ingresá un usuario para ver su historial.</p>
      ) : loading ? (
        <p className="text-gray-600">Cargando…</p>
      ) : historial.length > 0 ? (
        <table className="border-collapse border w-full bg-gray-50 shadow-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-left">Descripción</th>
              <th className="border p-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((h, i) => (
              <tr key={i} className="hover:bg-gray-100">
                <td className="border p-2">{h.tipo || "-"}</td>
                <td className="border p-2">{h.descripcion || h}</td>
                <td className="border p-2 text-sm text-gray-600">
                  {h.fecha ? new Date(h.fecha).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No hay historial registrado para {nombre}.</p>
      )}
    </div>
  );
}

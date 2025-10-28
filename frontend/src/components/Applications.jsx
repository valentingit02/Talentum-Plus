import { useEffect, useState } from "react";

export default function Applications() {
  const [usuarioInput, setUsuarioInput] = useState("");
  const [usuario, setUsuario] = useState("");
  const [procesos, setProcesos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!usuario) return;
    setLoading(true);
    setError("");
    fetch(`http://localhost:8000/api/dashboard/seleccion/usuario/${usuario.toLowerCase()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data.procesos)) {
          setProcesos([]);
          setError("⚠️ No se recibieron aplicaciones válidas desde el servidor.");
        } else {
          setProcesos(data.procesos);
        }
      })
      .catch(() => setError("❌ Error al obtener las aplicaciones del usuario."))
      .finally(() => setLoading(false));
  }, [usuario]);

  const buscarUsuario = () => {
    if (usuarioInput.trim()) {
      setUsuario(usuarioInput.trim().toLowerCase());
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📂 Aplicaciones a empleos</h2>

      <div className="flex gap-2 mb-6">
        <input
          value={usuarioInput}
          onChange={(e) => setUsuarioInput(e.target.value)}
          placeholder="Nombre de usuario..."
          className="border p-2 rounded w-full"
        />
        <button
          onClick={buscarUsuario}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Buscar
        </button>
      </div>

      {!usuario ? (
        <p className="text-gray-600">Ingresá un usuario para ver sus aplicaciones.</p>
      ) : loading ? (
        <p className="text-gray-600">Cargando…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : procesos.length === 0 ? (
        <p className="text-gray-600">
          No hay aplicaciones registradas para <strong>{usuario}</strong>.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {procesos.map((p, i) => (
            <div key={i} className="p-4 border rounded shadow-sm bg-gray-50">
              <h3 className="font-bold text-lg mb-2 text-gray-800">
                {p.posicion} en {p.empresa}
              </h3>
              <p><strong>Usuario:</strong> {p.usuario}</p>
              <p><strong>Estado:</strong> {p.estado || "pendiente"}</p>
              {p.feedback && <p><strong>Feedback:</strong> {p.feedback}</p>}
              {p.coincidencias && <p><strong>Coincidencias:</strong> {p.coincidencias}</p>}
              <p className="text-xs text-gray-500 mt-2">
                Fecha: {p.fecha ? new Date(p.fecha).toLocaleString() : "-"}
              </p>

              {p.entrevistas?.length > 0 && (
                <div className="mt-3">
                  <strong>Entrevistas:</strong>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {p.entrevistas.map((e, j) => (
                      <li key={j}>
                        {e.descripcion} - <span className="italic">{e.estado}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

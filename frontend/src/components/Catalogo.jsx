import { useEffect, useState } from "react";

export default function Catalogo() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [clase, setClase] = useState("");
  const [clases, setClases] = useState([]);

  const fetchCursos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/catalogo/");
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      const normalizados = (data.cursos || []).map((c) => ({
        ...c,
        clases: Array.isArray(c.clases) ? c.clases : [],
      }));
      setCursos(normalizados);
    } catch {
      setError("No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const agregarCurso = async () => {
    if (!titulo.trim()) {
      setError("El curso necesita un título.");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/catalogo/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          pdf_url: pdfUrl || null,
          clases: clases.length > 0 ? clases : [],
        }),
      });

      if (!res.ok) throw new Error("Error al crear curso");
      setTitulo("");
      setDescripcion("");
      setPdfUrl("");
      setClases([]);
      setClase("");
      fetchCursos();
    } catch {
      setError("No se pudo crear el curso.");
    }
  };

  const agregarClase = () => {
    if (clase.trim()) {
      setClases((prev) => [...prev, clase.trim()]);
      setClase("");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        📚 Catálogo de Cursos
      </h2>

      {/* Formulario */}
      <div className="p-6 border rounded-lg bg-gray-50 shadow mb-8">
        <h3 className="font-bold text-lg mb-4">➕ Nuevo Curso</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="URL del PDF"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="border p-2 rounded w-full mb-4"
          rows="3"
        />

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Agregar clase..."
            value={clase}
            onChange={(e) => setClase(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <button
            onClick={agregarClase}
            className="bg-blue-600 text-white px-4 rounded shadow hover:bg-blue-700"
          >
            Añadir
          </button>
        </div>

        {clases.length > 0 && (
          <ul className="list-disc list-inside text-sm mb-4 text-gray-700">
            {clases.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}

        <button
          onClick={agregarCurso}
          className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700"
        >
          Guardar Curso
        </button>
      </div>

      {/* Lista de cursos */}
      {loading ? (
        <p className="text-gray-600">Cargando cursos…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : cursos.length === 0 ? (
        <p className="text-gray-600">No hay cursos en el catálogo.</p>
      ) : (
        <div className="space-y-6">
          {cursos.map((c) => (
            <div
              key={c._id || c.titulo}
              className="p-6 border rounded-lg shadow bg-gray-50"
            >
              <h3 className="font-bold text-xl mb-2">{c.titulo}</h3>
              <p className="text-sm text-gray-700 mb-3">{c.descripcion}</p>

              {c.pdf_url && (
                <span className="text-gray-500 text-sm italic">📄 Ver PDF</span>
              )}

              {c.clases && c.clases.length > 0 && (
                <div className="mt-4 p-3 border rounded bg-white">
                  <h4 className="font-semibold text-sm mb-2">Clases:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {c.clases.map((cl, i) => (
                      <li key={i}>{cl}</li>
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

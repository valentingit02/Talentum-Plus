import { useState } from "react";

export default function Dashboard() {
  const [nombre, setNombre] = useState("");
  const [empresaCassandra, setEmpresaCassandra] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helpers
  const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

  const yaAplico = (pos) => {
    if (!result?.procesos) return false;
    return result.procesos.some(
      (p) =>
        (p.posicion || "").toLowerCase() ===
          (pos.titulo || pos.puesto || "").toLowerCase() &&
        (p.empresa || "").toLowerCase() === (pos.empresa || "").toLowerCase()
    );
  };

  // 🔎 Buscar usuario
  const buscarUsuario = async () => {
    if (!nombre.trim()) {
      setError("Por favor, ingresa un nombre de usuario.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const perfilRes = await fetch(
        `http://localhost:8000/api/dashboard/user/${encodeURIComponent(nombre)}`
      );
      if (!perfilRes.ok) throw new Error(`Error perfil ${perfilRes.status}`);
      const perfil = await perfilRes.json();

      const posRes = await fetch(
        `http://localhost:8000/api/dashboard/user/${encodeURIComponent(
          nombre
        )}/positions`
      );
      if (!posRes.ok) throw new Error(`Error posiciones ${posRes.status}`);
      const posData = await posRes.json();

      // 🔄 Procesos desde el endpoint correcto
      const procesosRes = await fetch(
        `http://localhost:8000/api/seleccion/usuario/${encodeURIComponent(
          nombre.toLowerCase()
        )}`
      );
      const procesosData = procesosRes.ok
        ? await procesosRes.json()
        : { procesos: [] };

      const perfilNormalizado = {
        ...perfil,
        skills: uniq(perfil.skills),
      };

      setResult({
        tipo: "usuario",
        perfil: perfilNormalizado,
        posiciones: posData.posiciones_recomendadas || [],
        capacitaciones_sugeridas: posData.capacitaciones_sugeridas || [],
        procesos: procesosData.procesos || [],
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo obtener el perfil o las posiciones recomendadas.");
    } finally {
      setLoading(false);
    }
  };

  // 🔎 Empresa Cassandra
  const buscarPosicionesCassandra = async () => {
    if (!empresaCassandra.trim()) {
      setError("Por favor, ingresa un nombre de empresa.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/positions/empresa/${encodeURIComponent(
          empresaCassandra
        )}`
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      // 🔄 Extra: traer usuarios que aplicaron a cada posición
      const posicionesConAplicaciones = await Promise.all(
        (data.posiciones || []).map(async (p) => {
          try {
            const resApp = await fetch(
              `http://localhost:8000/api/seleccion/posicion/${encodeURIComponent(
                p.puesto || p.titulo
              )}`
            );
            if (resApp.ok) {
              const apps = await resApp.json();
              return { ...p, aplicaciones: apps.procesos || [] };
            }
            return { ...p, aplicaciones: [] };
          } catch {
            return { ...p, aplicaciones: [] };
          }
        })
      );

      setResult({
        tipo: "cassandra",
        data: { empresa: data.empresa, posiciones: posicionesConAplicaciones },
      });
    } catch (err) {
      console.error(err);
      setError("Error al buscar posiciones (Cassandra).");
    } finally {
      setLoading(false);
    }
  };

  // 📝 Aplicar a posición
  const aplicarAPosicion = async (posicion) => {
    try {
      const res = await fetch("http://localhost:8000/api/seleccion/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: nombre,
          posicion: posicion.titulo || posicion.puesto,
          empresa: posicion.empresa,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al aplicar");

      alert(data.message || "Aplicación registrada ✅");

      // 🔄 Refrescar procesos (endpoint correcto)
      const procesosRes = await fetch(
        `http://localhost:8000/api/seleccion/usuario/${encodeURIComponent(
          nombre.toLowerCase()
        )}`
      );
      const procesosData = procesosRes.ok
        ? await procesosRes.json()
        : { procesos: [] };

      setResult((prev) => ({ ...prev, procesos: procesosData.procesos || [] }));
    } catch (err) {
      console.error(err);
      alert("No se pudo aplicar a la posición");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Dashboard de Coincidencias
      </h2>

      {/* 🔎 Inputs */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
        {/* Usuario */}
        <div className="flex gap-2">
          <input
            placeholder="Usuario..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 rounded w-64 shadow"
          />
          <button
            onClick={buscarUsuario}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Buscar usuario
          </button>
        </div>

        {/* Empresa Cassandra */}
        <div className="flex gap-2">
          <input
            placeholder="Nombre de empresa..."
            value={empresaCassandra}
            onChange={(e) => setEmpresaCassandra(e.target.value)}
            className="border p-2 rounded w-64 shadow"
          />
          <button
            onClick={buscarPosicionesCassandra}
            className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700"
          >
            Buscar posiciones por empresa
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600 text-center">Cargando…</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}

      {/* 📊 Usuario */}
      {result?.tipo === "usuario" && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Perfil */}
            <div className="p-6 border rounded-lg bg-white shadow-md">
              <h3 className="text-lg font-bold mb-3 text-gray-700">
                Perfil de {result.perfil.usuario}
              </h3>
              <p>
                <strong>Skills:</strong>{" "}
                {uniq(result.perfil.skills).join(", ") || "Ninguno"}
              </p>
              <p>
                <strong>Capacitaciones:</strong>{" "}
                {uniq(result.perfil.capacitaciones).join(", ") || "Ninguna"}
              </p>

              {result.perfil.sugerencias_capacitacion?.length > 0 && (
                <p className="mt-2 text-sm">
                  <strong>Sugerencias de capacitación:</strong>{" "}
                  {uniq(result.perfil.sugerencias_capacitacion).join(", ")}
                </p>
              )}

              {/* Historial */}
              {result.perfil.historial?.length > 0 && (
                <div className="mt-3">
                  <strong>Historial de cambios:</strong>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {result.perfil.historial.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Posiciones */}
            <div className="p-6 border rounded-lg bg-white shadow-md">
              <h3 className="text-lg font-bold mb-3 text-gray-700">
                Posiciones recomendadas
              </h3>
              {result.posiciones.length === 0 ? (
                <p className="text-gray-600">No hay posiciones que coincidan.</p>
              ) : (
                <ul className="space-y-4">
                  {result.posiciones.map((pos, i) => {
                    const aplicado = yaAplico(pos);

                    const cumpleExperiencia = pos.exp_match;
                    const cumpleEstudios =
                      pos.estudios_requeridos &&
                      result.perfil.capacitaciones?.includes(
                        pos.estudios_requeridos.toLowerCase()
                      );
                    const cumpleSkills = (pos.coincidencias || 0) >= 1;

                    const puedeAplicar =
                      [cumpleExperiencia, cumpleEstudios, cumpleSkills].filter(
                        Boolean
                      ).length >= 2;

                    return (
                      <li
                        key={i}
                        className="p-4 border rounded bg-gray-50 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p>
                              <strong>Puesto:</strong> {pos.titulo}
                            </p>
                            <p>
                              <strong>Empresa:</strong> {pos.empresa}
                            </p>
                            <p>
                              <strong>Skills requeridos:</strong>{" "}
                              {uniq(pos.skills_requeridos).join(", ")}
                            </p>
                            {pos.estudios_requeridos && (
                              <p>
                                <strong>Estudios:</strong>{" "}
                                {pos.estudios_requeridos}
                              </p>
                            )}
                            {pos.experiencia_requerida && (
                              <p>
                                <strong>Experiencia mínima:</strong>{" "}
                                {pos.experiencia_requerida}{" "}
                                {pos.exp_match ? (
                                  <span className="text-green-600 font-bold ml-2">
                                    ✅ Cumple
                                  </span>
                                ) : (
                                  <span className="text-red-600 font-bold ml-2">
                                    ❌ No cumple
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="text-blue-600 font-bold mt-2">
                              Coincidencias de skills: {pos.coincidencias}
                            </p>
                            {pos.faltantes?.length > 0 && (
                              <p className="text-red-600 text-sm mt-1">
                                Faltan skills: {pos.faltantes.join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="min-w-[140px] text-right">
                            {aplicado ? (
                              <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-700 text-sm font-semibold">
                                Ya aplicado (preselección)
                              </span>
                            ) : (
                              <button
                                onClick={() => aplicarAPosicion(pos)}
                                disabled={!puedeAplicar}
                                className={`px-3 py-2 rounded shadow text-white ${
                                  puedeAplicar
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-gray-400 cursor-not-allowed"
                                }`}
                                title={
                                  puedeAplicar
                                    ? "Aplicar a la posición"
                                    : "Necesitas cumplir al menos 2 de 3 requisitos (skills, experiencia, estudios)"
                                }
                              >
                                Aplicar
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Capacitaciones sugeridas */}
          {result.capacitaciones_sugeridas?.length > 0 && (
            <div className="p-6 border rounded-lg bg-yellow-50 shadow-md mt-6">
              <h3 className="text-lg font-bold mb-3">
                Capacitaciones sugeridas
              </h3>
              <ul className="list-disc list-inside">
                {result.capacitaciones_sugeridas.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Procesos de selección */}
          {result.procesos?.length > 0 && (
            <div className="p-6 border rounded-lg bg-white shadow-md mt-6">
              <h3 className="text-lg font-bold mb-3">Procesos de selección</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-sm">
                    <th className="p-2 border">Puesto</th>
                    <th className="p-2 border">Empresa</th>
                    <th className="p-2 border">Estado</th>
                    <th className="p-2 border">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {result.procesos.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border">{p.posicion}</td>
                      <td className="p-2 border">{p.empresa}</td>
                      <td className="p-2 border">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-sm font-semibold">
                          {p.estado}
                        </span>
                      </td>
                      <td className="p-2 border text-sm text-gray-600">
                        {p.fecha ? new Date(p.fecha).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 📊 Empresa Cassandra */}
      {result?.tipo === "cassandra" && (
        <div className="p-6 border rounded-lg bg-white shadow-md mt-6">
          <h3 className="text-lg font-bold mb-3">
            Empresa: {result.data.empresa}
          </h3>
          <ul className="space-y-3">
            {result.data.posiciones.map((p, i) => (
              <li key={i} className="p-4 border rounded bg-gray-50 shadow-sm">
                <p>
                  <strong>Puesto:</strong> {p.puesto || p.titulo}
                </p>
                <p>
                  <strong>Experiencia:</strong> {p.experiencia}
                </p>
                <p>
                  <strong>Estudios:</strong> {p.estudios}
                </p>
                {/* Usuarios que aplicaron */}
                {p.aplicaciones?.length > 0 ? (
                  <div className="mt-2">
                    <strong>Aplicaron:</strong>
                    <ul className="list-disc list-inside text-sm">
                      {p.aplicaciones.map((a, j) => (
                        <li key={j}>{a.usuario}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nadie aplicó aún</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

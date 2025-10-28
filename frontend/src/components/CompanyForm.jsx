import { useState } from "react";
import { postData } from "../api";

export default function CompanyForm() {
  const [nombre, setNombre] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await postData("/api/companies", { nombre });
    setMsg(res.message || JSON.stringify(res));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Empresa</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          placeholder="Nombre de la empresa"
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
        >
          Crear Empresa
        </button>
      </form>
      {msg && <p className="text-green-600 mt-3">{msg}</p>}
    </div>
  );
}

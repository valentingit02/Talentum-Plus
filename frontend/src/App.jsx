import { useState } from "react";
import UserForm from "./components/UserForm.jsx";
import CompanyForm from "./components/CompanyForm.jsx";
import PositionForm from "./components/PositionForm.jsx";
import SkillSearch from "./components/SkillSearch.jsx";
import Dashboard from "./components/Dashboard.jsx";
import CapacitacionForm from "./components/CapacitacionForm.jsx";
import SkillForm from "./components/SkillForm.jsx";
import Applications from "./components/Applications.jsx";
import Historial from "./components/HIstorial.jsx";
import Catalogo from "./components/Catalogo.jsx";

export default function App() {
  const [view, setView] = useState("dashboard");
  const [usuarioSeleccionado] = useState("matias");

  const buttonStyle = (active) =>
    `px-4 py-2 rounded-md font-medium transition ${
      active
        ? "bg-blue-600 text-white shadow"
        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
    }`;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-700">Talentum+</h1>
        </div>
      </header>

      {/* Navbar */}
      <nav className="flex flex-wrap justify-center gap-3 mb-8 max-w-6xl mx-auto px-4">
        <button onClick={() => setView("user")} className={buttonStyle(view === "user")}>
          Usuarios
        </button>
        <button onClick={() => setView("capacitacion")} className={buttonStyle(view === "capacitacion")}>
          Capacitaciones
        </button>
        <button onClick={() => setView("skillForm")} className={buttonStyle(view === "skillForm")}>
          Agregar Skills
        </button>
        <button onClick={() => setView("company")} className={buttonStyle(view === "company")}>
          Empresas
        </button>
        <button onClick={() => setView("position")} className={buttonStyle(view === "position")}>
          Posiciones
        </button>
        <button onClick={() => setView("skills")} className={buttonStyle(view === "skills")}>
          Segmentar Skills
        </button>
        <button onClick={() => setView("dashboard")} className={buttonStyle(view === "dashboard")}>
          Dashboard
        </button>
        <button onClick={() => setView("applications")} className={buttonStyle(view === "applications")}>
          Aplicaciones
        </button>
        <button onClick={() => setView("historial")} className={buttonStyle(view === "historial")}>
          Historial
        </button>
        <button onClick={() => setView("catalogo")} className={buttonStyle(view === "catalogo")}>
          Catálogo
        </button>
      </nav>

      {/* Vista dinámica */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="bg-white text-black rounded-lg shadow-md p-6">
          {view === "user" && <UserForm />}
          {view === "capacitacion" && <CapacitacionForm />}
          {view === "skillForm" && <SkillForm />}
          {view === "company" && <CompanyForm />}
          {view === "position" && <PositionForm />}
          {view === "skills" && <SkillSearch />}
          {view === "dashboard" && <Dashboard />}
          {view === "applications" && <Applications usuario={usuarioSeleccionado} />}
          {view === "historial" && <Historial />}
          {view === "catalogo" && <Catalogo />}
        </div>
      </main>
    </div>
  );
}

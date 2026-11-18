import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Accueil from "./pages/Accueil";
import Accompagnements from "./pages/Accompagnements";
import Tarifs from "./pages/Tarifs";
import Stages from "./pages/Stages";
import AvisPage from "./pages/Avis";
import Contact from "./pages/Contact";
import Inscription from "./pages/Inscription";
import Introuvable from "./pages/Introuvable";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/accompagnements" element={<Accompagnements />} />
        <Route path="/tarifs" element={<Tarifs />} />
        <Route path="/stages" element={<Stages />} />
        <Route path="/avis" element={<AvisPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="*" element={<Introuvable />} />
      </Routes>
    </Layout>
  );
}

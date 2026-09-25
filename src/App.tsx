import { Route, Routes } from "react-router-dom";
import { ShaderBackground } from "./components/ShaderBackground";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteFooter } from "./components/layout/SiteFooter";
import { EventPopup } from "./components/layout/EventPopup";
import { HomePage } from "./pages/HomePage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { CharactersPage } from "./pages/CharactersPage";

export default function App() {
  return (
    <>
      <ShaderBackground />
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/characters" element={<CharactersPage />} />
      </Routes>
      <SiteFooter />
      <EventPopup />
    </>
  );
}

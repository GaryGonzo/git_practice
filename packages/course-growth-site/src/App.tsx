import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { HowItWorks } from "./pages/HowItWorks";
import { Buildout } from "./pages/Buildout";
import { WhatsIncluded } from "./pages/WhatsIncluded";
import { Guarantee } from "./pages/Guarantee";
import { Results } from "./pages/Results";
import { About } from "./pages/About";
import { FAQ } from "./pages/FAQ";
import { Apply } from "./pages/Apply";
import { Contact } from "./pages/Contact";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/buildout" element={<Buildout />} />
        <Route path="/whats-included" element={<WhatsIncluded />} />
        <Route path="/guarantee" element={<Guarantee />} />
        <Route path="/results" element={<Results />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Arcade from "./pages/Arcade";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/arcade" element={<Arcade />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

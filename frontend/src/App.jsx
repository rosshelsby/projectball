import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Squad from './pages/Squad';
import Fixtures from './pages/Fixtures';
import Training from './pages/Training';
import TransferMarket from './pages/TransferMarket';

function App() {
  return (
    <BrowserRouter>
      <Layout>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/squad" element={<Squad />} />
        <Route path="/fixtures" element={<Fixtures />} />
        <Route path="/training" element={<Training />} />
        <Route path="/market" element={<TransferMarket />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
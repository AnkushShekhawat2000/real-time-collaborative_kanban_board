import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import BoardPage from "./pages/BoardPage.jsx";
import WorkspaceLayout from "./routes/WorkspaceLayout.jsx";
import "./App.css";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<WorkspaceLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/boards/:boardId" element={<BoardPage />} />
                        </Route>
                    </Route>

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return; // Prevent re-running

    const handleAuthCallback = async () => {
      try {
        const token = searchParams.get("token");
        const name = searchParams.get("name");
        const email = searchParams.get("email");
        const role = searchParams.get("role");

        if (!token || !name || !email || !role) {
          setError("Authentication failed. Missing required parameters.");
          setProcessed(true);
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          return;
        }

        localStorage.setItem("token", token);
localStorage.setItem("role", role);
localStorage.setItem("name", name);
localStorage.setItem("email", email);

        // Save user data to auth context
        login({ name, email, token, role });
        setProcessed(true);

        try {
          // Fetch additional user details
          const { data } = await API.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (data && data.hasPassword === false) {
            login({ name, email, token, role, hasPassword: false });
            navigate("/set-password", { replace: true });
            return;
          }
          
          if (data && data.hasPassword !== undefined) {
            login({ name, email, token, role, hasPassword: data.hasPassword });
          }
        } catch (err) {
          console.error("Failed to fetch user details:", err);
          // Continue with basic auth data
        }

        // Redirect to home page or dashboard
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Authentication failed. Please try again.");
        setProcessed(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, login, processed]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        {error ? (
          <div>
            <div className="text-red-600 text-xl font-semibold mb-2">{error}</div>
            <div className="text-gray-600 dark:text-gray-400">Redirecting to login...</div>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-lg font-semibold mb-2 dark:text-white">Authenticating...</div>
            <div className="text-gray-600 dark:text-gray-400">Please wait while we sign you in.</div>
          </div>
        )}
      </div>
    </div>
  );
}
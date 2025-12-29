import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const role = searchParams.get("role");

    if (token && name && email && role) {
      // Save user data to auth context
      login({ name, email, token, role });
      
      // Redirect to home page
      navigate("/");
    } else {
      setError("Authentication failed. Please try again.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div>
            <div className="text-red-600 text-lg mb-2">{error}</div>
            <div className="text-gray-600">Redirecting to login...</div>
          </div>
        ) : (
          <div>
            <div className="text-lg mb-2">Authenticating...</div>
            <div className="text-gray-600">Please wait while we sign you in.</div>
          </div>
        )}
      </div>
    </div>
  );
}

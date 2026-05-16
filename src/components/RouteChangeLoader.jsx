// src/components/RouteChangeLoader.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

export default function RouteChangeLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 900); // duración ~1 segundo

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading ? <PageLoader /> : null;
}

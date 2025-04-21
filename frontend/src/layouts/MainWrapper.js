import { useEffect, useState } from "react";
import { setUser } from "../utils/auth";

const MainWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await setUser();
      setLoading(false);
    })();
  }, []);

  return loading ? null : children;
};

export default MainWrapper;

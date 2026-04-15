
// import React, { createContext, useEffect, useState, useRef, useContext } from "react";
// import { debounce } from "lodash";
// import { useInterval } from "react-use";
// import {
//   useUpsertViewPointMutation,
//   useGetViewPointsByUserQuery,
// } from "@/redux/api/ViewPointApi";
// import { AuthContext } from "@/modules/landing/context/AuthContext";

// export const ActiveUserContext = createContext();

// export const ActiveUserProvider = ({ children }) => {
//   const { user } = useContext(AuthContext);
//   const userId = user?.user?._id;

//   const [points, setPoints] = useState(() =>
//     parseInt(sessionStorage.getItem("userPoints") || "0", 10)
//   );
//   const activeSecondsRef = useRef(0);
//   const lastActivityRef = useRef(Date.now());
//   const isTabActive = useRef(true);

//   // 🆕 Track opened product IDs
//   const productViewsRef = useRef(
//     new Set(JSON.parse(sessionStorage.getItem("productViews") || "[]"))
//   );

//   const [upsertViewPoint] = useUpsertViewPointMutation();
//   const { data, refetch } = useGetViewPointsByUserQuery(userId, {
//     skip: !userId,
//   });

//   // Sync view_Points from backend on load
//   useEffect(() => {
//     if (data?.data?.view_Points != null) {
//       setPoints(data.data.view_Points);
//       sessionStorage.setItem("userPoints", data.data.view_Points.toString());
//     }
//   }, [data]);

//   // Restore saved activeSeconds from sessionStorage
//   useEffect(() => {
//     const savedSeconds = parseInt(sessionStorage.getItem("activeSeconds") || "0", 10);
//     activeSecondsRef.current = isNaN(savedSeconds) ? 0 : savedSeconds;
//   }, []);

//   // Activity detection
//   const handleUserActivity = debounce(() => {
//     if (isTabActive.current) {
//       lastActivityRef.current = Date.now();
//     }
//   }, 300);

//   const handleVisibilityChange = () => {
//     isTabActive.current = !document.hidden;
//   };

//   useEffect(() => {
//     const events = [
//       "mousemove", "click", "mousedown", "mouseup", "wheel",
//       "keydown", "keyup", "touchstart", "touchmove", "scroll",
//       "pointerdown", "pointermove"
//     ];
//     events.forEach((event) => window.addEventListener(event, handleUserActivity));
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     return () => {
//       events.forEach((event) => window.removeEventListener(event, handleUserActivity));
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//     };
//   }, []);

//   // 🆕 Function to track product view
//   const trackProductView = (productId) => {
//     if (!productId) return;
//     productViewsRef.current.add(productId);
//     sessionStorage.setItem("productViews", JSON.stringify([...productViewsRef.current]));
//   };

//   // API call to upsert view points
//   const sendViewPointToServer = async () => {
//     if (!userId) return;

//     try {
//       const res = await upsertViewPoint({
//         user_id: userId,
//         view_points: (points || 0) + 10, // increment by 10
//       }).unwrap();

//       const newPoints = res?.data?.view_Points || points + 10;
//       setPoints(newPoints);
//       sessionStorage.setItem("userPoints", newPoints.toString());
//       await refetch();
//       console.log("✅ View points updated:", newPoints);
//     } catch (err) {
//       console.error("❌ Failed to update view points:", err);
//     }
//   };

//   // Interval check every 1 minute
//   useInterval(() => {
//     if (!userId) return;

//     const now = Date.now();
//     const isActive = isTabActive.current && now - lastActivityRef.current < 60000;

//     if (isActive) {
//       activeSecondsRef.current += 60;
//       sessionStorage.setItem("activeSeconds", activeSecondsRef.current.toString());
//     }

//     // 🆕 Check both conditions: 1hr active & at least 5 unique products
//     if (activeSecondsRef.current >= 3600 && productViewsRef.current.size >= 5) {
//       sendViewPointToServer();

//       // reset counters
//       activeSecondsRef.current = 0;
//       productViewsRef.current.clear();
//       sessionStorage.setItem("activeSeconds", "0");
//       sessionStorage.setItem("productViews", JSON.stringify([]));
//     }
//   }, 60000); // 60s interval

//   return (
//     <ActiveUserContext.Provider value={{ points, trackProductView }}>
//       {children}
//     </ActiveUserContext.Provider>
//   );
// };


// File: ../context/ActiveUserProvider.js
import React, { createContext, useEffect, useState, useRef, useContext } from "react";
import { debounce } from "lodash";
import { useInterval } from "react-use";
import {
  useUpsertViewPointMutation,
  useGetViewPointsByUserQuery,
} from "@/redux/api/ViewPointApi";
import { useGetViewPointConfigQuery } from "@/redux/api/PointApi"; // Import the new query
import { AuthContext } from "@/modules/landing/context/AuthContext";

export const ActiveUserContext = createContext();

export const ActiveUserProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;

  const [points, setPoints] = useState(() =>
    parseInt(sessionStorage.getItem("userPoints") || "0", 10)
  );
  const activeSecondsRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const isTabActive = useRef(true);

  // Track opened product IDs
  const productViewsRef = useRef(
    new Set(JSON.parse(sessionStorage.getItem("productViews") || "[]"))
  );

  const [upsertViewPoint] = useUpsertViewPointMutation();
  const { data: userViewPointsData, refetch } = useGetViewPointsByUserQuery(userId, {
    skip: !userId,
  });

  // Fetch the view_point configuration
  const { data: viewPointConfig } = useGetViewPointConfigQuery();

  // Dynamic values with defaults
  const pointIncrement = viewPointConfig?.data?.point_amount || 10;
  const timeDuration = viewPointConfig?.data?.time_duration || 60; // Default to 60
  const timeUnit = viewPointConfig?.data?.time_unit || "minutes"; // Default to "minutes"

  // Calculate required seconds based on time_unit
  const requiredSeconds =
    timeUnit === "seconds" ? timeDuration :
    timeUnit === "minutes" ? timeDuration * 60 :
    timeDuration * 3600; // For hours

  // Sync view_Points from backend on load
  useEffect(() => {
    if (userViewPointsData?.data?.view_points != null) {
      setPoints(userViewPointsData.data.view_points);
      sessionStorage.setItem("userPoints", userViewPointsData.data.view_points.toString());
    }
  }, [userViewPointsData]);

  // Restore saved activeSeconds from sessionStorage
  useEffect(() => {
    const savedSeconds = parseInt(sessionStorage.getItem("activeSeconds") || "0", 10);
    activeSecondsRef.current = isNaN(savedSeconds) ? 0 : savedSeconds;
  }, []);

  // Activity detection
  const handleUserActivity = debounce(() => {
    if (isTabActive.current) {
      lastActivityRef.current = Date.now();
    }
  }, 300);

  const handleVisibilityChange = () => {
    isTabActive.current = !document.hidden;
  };

  useEffect(() => {
    const events = [
      "mousemove", "click", "mousedown", "mouseup", "wheel",
      "keydown", "keyup", "touchstart", "touchmove", "scroll",
      "pointerdown", "pointermove"
    ];
    events.forEach((event) => window.addEventListener(event, handleUserActivity));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Function to track product view
  const trackProductView = (productId) => {
    if (!productId) return;
    productViewsRef.current.add(productId);
    sessionStorage.setItem("productViews", JSON.stringify([...productViewsRef.current]));
  };

  // API call to upsert view points
  const sendViewPointToServer = async () => {
    if (!userId) return;

    try {
      const res = await upsertViewPoint({
        user_id: userId,
        view_points: pointIncrement, // Send only the increment amount
      }).unwrap();

      const newPoints = res?.data?.view_points || points + pointIncrement;
      setPoints(newPoints);
      sessionStorage.setItem("userPoints", newPoints.toString());
      await refetch();
      console.log("✅ View points updated:", newPoints);
    } catch (err) {
      console.error("❌ Failed to update view points:", err);
    }
  };

  // Interval check every 1 minute
  useInterval(() => {
    if (!userId) return;

    const now = Date.now();
    const isActive = isTabActive.current && now - lastActivityRef.current < 60000;

    if (isActive) {
      activeSecondsRef.current += 60;
      sessionStorage.setItem("activeSeconds", activeSecondsRef.current.toString());
    }

    // Check conditions: dynamic time active & at least 5 unique products
    if (activeSecondsRef.current >= requiredSeconds && productViewsRef.current.size >= 5) {
      sendViewPointToServer();

      // Reset counters
      activeSecondsRef.current = 0;
      productViewsRef.current.clear();
      sessionStorage.setItem("activeSeconds", "0");
      sessionStorage.setItem("productViews", JSON.stringify([]));
    }
  }, 60000); // 60s interval

  return (
    <ActiveUserContext.Provider value={{ points, trackProductView }}>
      {children}
    </ActiveUserContext.Provider>
  );
};

export default ActiveUserContext;
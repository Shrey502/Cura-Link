// src/components/DigitalClock.jsx
import React, { useState, useEffect } from 'react';
import '../App.css'; // We'll add styles to App.css

function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update the time every second
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(timerId);
    };
  }, []);

  // Format the time to be HH:MM:SS
  const formattedTime = time.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: false // Use 24-hour clock
  });

  return (
    <div className="digital-clock">
      {formattedTime}
    </div>
  );
}

export default DigitalClock;

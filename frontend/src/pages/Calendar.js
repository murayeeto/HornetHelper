import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8
  });
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.8,
        height: window.innerHeight * 0.8
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const today = new Date();
  const month = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Calendar generation
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, currentDate.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  const isCurrentDay = (day) => {
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           year === today.getFullYear();
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(year, currentDate.getMonth(), day);
    setSelectedDay(clickedDate);
  };

  const closeDayView = () => {
    setSelectedDay(null);
  };

  // Calculate cell height based on available space
  const headerHeight = 80;
  const gridHeight = dimensions.height - headerHeight - 40;
  const cellHeight = `${(gridHeight / 6) - 10}px`;

  return (
    <div 
      className="calendar-exact" 
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
    >
      {selectedDay ? (
        <div className="day-view">
          <div className="day-view-header">
            <button onClick={closeDayView}>&larr; Back</button>
            <h2>{selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          </div>
          <div className="day-view-content">
            <p>Day details view will go here</p>
            <p>Events, notes, etc.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="calendar-header-exact">
            <button onClick={() => changeMonth(-1)}>&lt;</button>
            <h2>{month} {year}</h2>
            <button onClick={() => changeMonth(1)}>&gt;</button>
          </div>

          <div className="calendar-grid-exact">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="day-header-exact">{day}</div>
            ))}

            {days.map((day, i) => (
              <div 
                key={day || `empty-${i}`}
                className={`day-cell-exact ${
                  !day ? 'empty' : 
                  isCurrentDay(day) ? 'today' : 
                  ''
                }`}
                data-weekend={day && [0, 6].includes(new Date(year, currentDate.getMonth(), day).getDay())}
                style={{ height: cellHeight }}
                onClick={() => handleDayClick(day)}
              >
                {day && <div className="day-number-exact">{day}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Calendar;
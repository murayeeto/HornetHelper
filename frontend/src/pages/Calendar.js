import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState({}); // Format: { "YYYY-MM-DD": { "9": {event}, "10.5": {event} } }
  const [newEvent, setNewEvent] = useState({
    hour: '',
    title: '',
    color: '#4a6fa5'
  });

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

  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const addTimeEvent = () => {
    if (newEvent.hour && newEvent.title && selectedDay) {
      const dateKey = formatDateKey(selectedDay);
      const hourKey = parseFloat(newEvent.hour);
      
      setEvents(prev => ({
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          [hourKey]: {
            id: Date.now(),
            title: newEvent.title,
            color: newEvent.color
          }
        }
      }));
      
      setNewEvent({ hour: '', title: '', color: '#4a6fa5' });
    }
  };

  const renderTimeline = () => {
    if (!selectedDay) return null;
    
    const dateKey = formatDateKey(selectedDay);
    const dayEvents = events[dateKey] || {};
    
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i;
      const halfHour = i + 0.5;

      // Full hour
      hours.push(
        <div key={`hour-${hour}`} className="timeline-slot full-hour">
          <div className="time-label">
            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
          </div>
          <div className="time-line">
            {dayEvents[hour] && (
              <div 
                className="time-event"
                style={{ backgroundColor: dayEvents[hour].color }}
              >
                {dayEvents[hour].title}
              </div>
            )}
          </div>
        </div>
      );

      // Half hour (except for 23:30)
      if (i < 23) {
        hours.push(
          <div key={`half-${hour}`} className="timeline-slot half-hour">
            <div className="time-label">
              {hour === 0 ? '12:30 AM' : hour < 12 ? `${hour}:30 AM` : hour === 12 ? '12:30 PM' : `${hour-12}:30 PM`}
            </div>
            <div className="time-line">
              {dayEvents[halfHour] && (
                <div 
                  className="time-event"
                  style={{ backgroundColor: dayEvents[halfHour].color }}
                >
                  {dayEvents[halfHour].title}
                </div>
              )}
            </div>
          </div>
        );
      }
    }
    return hours;
  };

  // Generate time options in order
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    const hour = i;
    const halfHour = i + 0.5;
    
    timeOptions.push(
      <option key={`hour-${hour}`} value={hour}>
        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour-12} PM`}
      </option>
    );
    
    if (i < 23) {
      timeOptions.push(
        <option key={`half-${hour}`} value={halfHour}>
          {hour === 0 ? '12:30 AM' : hour < 12 ? `${hour}:30 AM` : hour === 12 ? '12:30 PM' : `${hour-12}:30 PM`}
        </option>
      );
    }
  }

  // Calculate cell height based on available space
  const headerHeight = 80;
  const gridHeight = dimensions.height - headerHeight - 40;
  const cellHeight = `${(gridHeight / 6) - 10}px`;

  return (
    <div className="calendar-exact-container">
      <div 
        className="calendar-exact" 
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minHeight: '500px'
        }}
      >
        {selectedDay ? (
          <div className="day-view">
            <div className="day-view-header">
              <button onClick={closeDayView}>&larr; Back</button>
              <h2>{selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
            </div>
            
            <div className="timeline-container">
              <div className="timeline">
                {renderTimeline()}
              </div>
            </div>
            
            <div className="add-event-form">
              <h3>Add New Event</h3>
              <div className="form-row">
                <label>Time:</label>
                <select 
                  value={newEvent.hour}
                  onChange={(e) => setNewEvent({...newEvent, hour: e.target.value})}
                >
                  <option value="">Select time</option>
                  {timeOptions}
                </select>
              </div>
              <div className="form-row">
                <label>Title:</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="Event description"
                />
              </div>
              <div className="form-row">
                <label>Color:</label>
                <input
                  type="color"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                />
              </div>
              <button onClick={addTimeEvent}>Add Event</button>
            </div>
          </div>
        ) : (
          <>
            <div className="calendar-header-exact">
              <button onClick={() => changeMonth(-1)}>&lt;</button>
              <h2>{month} {year}</h2>
              <button onClick={() => changeMonth(1)}>&gt;</button>
            </div>

            <div className="calendar-grid-container">
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
                    {day && (
                      <>
                        <div className="day-number-exact">{day}</div>
                        {isCurrentDay(day) && (
                          <div className="today-indicator">Today</div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Calendar;
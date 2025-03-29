import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebase from '../firebase';

const Calendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState({});

  // Load events from Firebase when component mounts
  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;

      try {
        const eventsRef = doc(firebase.db, 'users', user.uid, 'data', 'events');
        const eventsSnap = await getDoc(eventsRef);

        if (eventsSnap.exists()) {
          setEvents(eventsSnap.data().events || {});
        }
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents();
  }, [user]);
  const [newEvent, setNewEvent] = useState({
    hour: '9',
    minute: '00',
    period: 'AM',
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
    window.scrollTo(0, 0);
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

  const getDayEvents = (day) => {
    if (!day) return [];
    const date = new Date(year, currentDate.getMonth(), day);
    const dateKey = formatDateKey(date);
    return events[dateKey] ? Object.values(events[dateKey]) : [];
  };

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
    return date.toISOString().split('T')[0];
  };

  const convertToTimeValue = (hour, minute, period) => {
    let hour24 = parseInt(hour);
    minute = parseInt(minute);

    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    return hour24 + (minute / 60);
  };

  const addTimeEvent = async () => {
    if (!newEvent.title || !user) return;

    const timeValue = convertToTimeValue(newEvent.hour, newEvent.minute, newEvent.period);
    const dateKey = formatDateKey(selectedDay);

    const newEvents = {
      ...events,
      [dateKey]: {
        ...events[dateKey],
        [timeValue]: {
          id: Date.now(),
          title: newEvent.title,
          color: newEvent.color,
          displayTime: `${newEvent.hour}:${newEvent.minute} ${newEvent.period}`
        }
      }
    };

    try {
      // Save to Firebase
      const eventsRef = doc(firebase.db, 'users', user.uid, 'data', 'events');
      await setDoc(eventsRef, { events: newEvents }, { merge: true });

      // Update local state
      setEvents(newEvents);

      // Reset form
      setNewEvent({
        hour: '9',
        minute: '00',
        period: 'AM',
        title: '',
        color: '#4a6fa5'
      });
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const deleteEvent = async (dateKey, timeValue) => {
    if (!user) return;

    try {
      // Get current events from Firebase
      const eventsRef = doc(firebase.db, 'users', user.uid, 'data', 'events');
      const eventsSnap = await getDoc(eventsRef);

      if (eventsSnap.exists()) {
        const currentEvents = eventsSnap.data().events || {};

        // Delete the specific event
        if (currentEvents[dateKey] && currentEvents[dateKey][timeValue]) {
          delete currentEvents[dateKey][timeValue];

          // Clean up empty dates
          if (Object.keys(currentEvents[dateKey]).length === 0) {
            delete currentEvents[dateKey];
          }

          // Update Firebase with the new events object
          await setDoc(eventsRef, { events: currentEvents });

          // Update local state
          setEvents(currentEvents);
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const renderTimeline = () => {
    if (!selectedDay) return null;

    const dateKey = formatDateKey(selectedDay);
    const dayEvents = events[dateKey] || {};

    // Create timeline slots for each hour
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(
        <div key={`hour-${i}`} className="timeline-slot">
          <div className="time-label">
            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
          </div>
          <div className="time-line"></div>
        </div>
      );
    }

    // Create events at their exact positions
    const eventElements = Object.entries(dayEvents).map(([time, event]) => {
      const timeValue = parseFloat(time);
      // Calculate position in pixels (60px per hour, 1px per minute)
      const topPosition = timeValue * 60; // Convert hours to pixels

      return (
        <div
          key={event.id}
          className="time-event"
          style={{
            top: `${topPosition}px`,
            backgroundColor: event.color
          }}
        >
          <span className="event-time">{event.displayTime}</span>
          <span className="event-title">{event.title}</span>
          <button
            className="delete-event-btn"
            onClick={(e) => {
              e.stopPropagation();
              deleteEvent(dateKey, time);
            }}
          >
            ×
          </button>
        </div>
      );
    });

    return (
      <div className="timeline-container">
        <div className="timeline">
          {hours}
          <div className="time-events-container">
            {eventElements}
          </div>
        </div>
      </div>
    );
  };
  // Generate time options
  const hourOptions = Array.from({ length: 12 }, (_, i) => (
    <option key={i + 1} value={i + 1}>{i + 1}</option>
  ));

  const minuteOptions = Array.from({ length: 60 }, (_, i) => (
    <option key={i} value={i.toString().padStart(2, '0')}>
      {i.toString().padStart(2, '0')}
    </option>
  ));

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
                <div className="time-input-group">
                  <select
                    value={newEvent.hour}
                    onChange={(e) => setNewEvent({ ...newEvent, hour: e.target.value })}
                  >
                    {hourOptions}
                  </select>
                  <span>:</span>
                  <select
                    value={newEvent.minute}
                    onChange={(e) => setNewEvent({ ...newEvent, minute: e.target.value })}
                  >
                    {minuteOptions}
                  </select>
                  <select
                    value={newEvent.period}
                    onChange={(e) => setNewEvent({ ...newEvent, period: e.target.value })}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <label>Title:</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event description"
                />
              </div>
              <div className="form-row">
                <label>Color:</label>
                <input
                  type="color"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
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
                    className={`day-cell-exact ${!day ? 'empty' :
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
                        <div className="day-events-preview">
                          {getDayEvents(day)
                            .slice(0, 3)
                            .map(event => (
                              <div
                                key={event.id}
                                className="event-preview"
                                style={{ '--event-color': event.color }}
                                data-time={event.displayTime.replace(/:00 /, ' ').replace('AM', 'A').replace('PM', 'P')}
                              >
                                {event.title}
                              </div>
                            ))}
                        </div>
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
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/navbar";

const Event = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  const [isTeacher, setIsTeacher] = useState(false);

  const API_URL = "http://localhost:4000/events";

  // Fetch user role from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setIsTeacher(decoded.role === "teacher");
    }
  }, []);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      const res = await axios.get(API_URL);
      setEvents(res.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Add new event
  const handleAddEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(API_URL, newEvent, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNewEvent({ title: "", date: "", description: "" });
      fetchEvents(); // 🔄 Refresh list after adding
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Error adding event. Please check backend console.");
    }
  };

  return (
    <div className="min-h-screen bg-[#070B13] text-white">
        <Navbar/>
      {/* Show Add Event only for Teachers */}
      {isTeacher && (
        <div className="max-w-5xl mx-auto py-10 px-4">
          <h2 className="text-3xl font-bold mb-6">Add New Event</h2>
          <input
            type="text"
            placeholder="Title"
            className="w-full p-2 mb-2 rounded bg-[#1c2333]"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />
          <input
            type="date"
            className="w-full p-2 mb-2 rounded bg-[#1c2333]"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full p-2 mb-2 rounded bg-[#1c2333]"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
          <button
            onClick={handleAddEvent}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Event
          </button>
        </div>
      )}

      {/* Show Events */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Events</h2>
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <div
                key={event.id || event._id}
                className="bg-[#121826] p-4 rounded-lg shadow-md border border-[#1e2a3a]"
              >
                <h3 className="text-xl font-bold">{event.title}</h3>
                <p className="text-gray-400">{new Date(event.date).toDateString()}</p>
                <p className="mt-2">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Event;
import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { apiClient } from "../api/client";

const Event = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  const [isTeacher, setIsTeacher] = useState(false);

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
      const data = await apiClient.get("/events");
      setEvents(data);
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
      await apiClient.post("/events", newEvent);
      setNewEvent({ title: "", date: "", description: "" });
      fetchEvents(); // 🔄 Refresh list after adding
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Error adding event. Please check backend console.");
    }
  };

  return (
    <div className="bg-[#0D111A] p-2 text-white">
      <div className="min-h-screen bg-[#070B13] rounded-lg shadow-black shadow-md">
        <Navbar />

        <div className="max-w-5xl mx-auto py-10 px-4 md:px-8">
          {/* Show Add Event only for Teachers */}
          {isTeacher && (
            <section className="mb-10">
              <h2 className="text-3xl font-bold mb-6">Add New Event</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full p-2 rounded bg-[#1c2333] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="w-full p-2 rounded bg-[#1c2333] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                />
                <textarea
                  placeholder="Description"
                  className="w-full p-2 rounded bg-[#1c2333] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={4}
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({
                      ...newEvent,
                      description: e.target.value,
                    })
                  }
                />
                <button
                  onClick={handleAddEvent}
                  className="bg-cyan-600 px-4 py-2 rounded-md hover:bg-cyan-500 font-medium"
                >
                  Add Event
                </button>
              </div>
            </section>
          )}

          {/* Show Events */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">All Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-400">No events yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <article
                    key={event.id || event._id}
                    className="bg-[#121826] p-4 rounded-lg shadow-md border border-[#1e2a3a]"
                  >
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <p className="text-gray-400">
                      {new Date(event.date).toDateString()}
                    </p>
                    <p className="mt-2 text-sm text-gray-200">
                      {event.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Event;
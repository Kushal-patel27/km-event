import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import formatINR from "../utils/currency";
import { getEventImage } from "../utils/images";
import { seatsAvailable } from "../utils/bookings";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let mounted = true;
    setFetching(true);
    API.get(`/events/${id}`)
      .then((res) => {
        if (!mounted) return;
        const e = res.data;
        // normalize id
        e.id = e.id || e._id;
        setEvent(e);
      })
      .catch(() => alert("Failed to load event"))
      .finally(() => mounted && setFetching(false));

    return () => (mounted = false);
  }, [id]);

  const bookHandler = async () => {
    if (!user) {
      alert("Please login to book tickets");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await API.post(
        "/bookings",
        {
          eventId: event._id || event.id,
          quantity: qty,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("🎉 Booking successful!");
      navigate("/my-bookings");
    } catch (err) {
      alert(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center mt-10">Loading event...</div>;
  if (!event) return <div className="text-center mt-10">Event not found</div>;

  const eventId = event._id || event.id;
  const available = seatsAvailable(event);

  return (
    <>
      <div className="max-w-3xl mx-auto p-6">
        <img
          src={getEventImage(event) || event.image || "/event-placeholder.jpg"}
          alt={event.title}
          className="w-full h-64 object-cover rounded mb-4"
        />

        <h1 className="text-2xl font-bold">{event.title}</h1>

        <p className="text-sm text-gray-500">
          {new Date(event.date).toDateString()} • {event.location}
        </p>

        <div className="mt-2">
          <span className="text-sm font-medium">Category:</span>{" "}
          <span className="text-sm text-gray-600">{event.category || "-"}</span>

          <span className="ml-4 text-sm font-medium">Capacity:</span>{" "}
          <span className="text-sm text-gray-600">{event.capacity}</span>

          <span className="ml-4 text-sm font-medium">Available:</span>{" "}
          <span className="text-sm text-indigo-600">{available === Infinity ? 'Open' : available}</span>
        </div>

        <p className="mt-4">{event.description}</p>

        <div className="mt-4 text-sm text-gray-600">
          <div>Organizer: {event.organizer?.name || "-"}</div>
          <div>Email: {event.organizer?.email || "-"}</div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-lg font-bold">{formatINR(event.price)}</div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={available === Infinity ? undefined : available}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="border rounded p-2 w-20"
            />

            <button
              onClick={bookHandler}
              disabled={loading || available === 0}
              className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Booking..." : "Book Tickets"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

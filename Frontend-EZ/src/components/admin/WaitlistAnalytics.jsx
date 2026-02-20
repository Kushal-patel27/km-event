import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';

export default function WaitlistAnalytics() {
  const { eventId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState('');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, waitlistRes] = await Promise.all([
        API.get(`/waitlist/event/${eventId}/analytics`),
        API.get(`/waitlist/event/${eventId}`)
      ]);
      setAnalytics(analyticsRes.data);
      setWaitlist(waitlistRes.data.waitlist);
    } catch (err) {
      console.error('Failed to fetch waitlist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyWaitlist = async () => {
    if (!selectedTicketType) {
      alert('Please select a ticket type');
      return;
    }

    const quantity = prompt('How many tickets are available?', '1');
    if (!quantity || isNaN(quantity)) return;

    try {
      setNotifying(true);
      await API.post(`/waitlist/event/${eventId}/notify`, {
        ticketType: selectedTicketType,
        quantity: parseInt(quantity)
      });
      alert('Waitlist notifications sent successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Failed to notify waitlist:', err);
      alert('Failed to send notifications');
    } finally {
      setNotifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-12">No waitlist data available</div>;
  }

  const ticketTypes = analytics.byTicketType?.map(t => t._id) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Waiting</div>
          <div className="text-3xl font-bold text-yellow-600">
            {analytics.summary.totalWaiting}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Notified</div>
          <div className="text-3xl font-bold text-blue-600">
            {analytics.summary.totalNotified}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Converted</div>
          <div className="text-3xl font-bold text-green-600">
            {analytics.summary.totalConverted}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
          <div className="text-3xl font-bold text-purple-600">
            {analytics.summary.conversionRate}
          </div>
        </div>
      </div>

      {/* Notify Waitlist */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Notify Waitlist</h3>
        <div className="flex gap-3">
          <select
            value={selectedTicketType}
            onChange={(e) => setSelectedTicketType(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Ticket Type</option>
            {ticketTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button
            onClick={handleNotifyWaitlist}
            disabled={notifying || !selectedTicketType}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {notifying ? 'Notifying...' : 'Notify Next in Line'}
          </button>
        </div>
      </div>

      {/* By Ticket Type */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Waitlist by Ticket Type</h3>
        <div className="space-y-4">
          {analytics.byTicketType?.map(item => {
            const stats = item.statuses.reduce((acc, s) => {
              acc[s.status] = s.count;
              return acc;
            }, {});
            
            return (
              <div key={item._id} className="border-l-4 border-indigo-500 pl-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{item._id}</h4>
                  <span className="text-sm text-gray-600">Total: {item.total}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-yellow-600">⏳ Waiting: {stats.waiting || 0}</span>
                  <span className="text-blue-600">🔔 Notified: {stats.notified || 0}</span>
                  <span className="text-green-600">✅ Converted: {stats.converted || 0}</span>
                  <span className="text-red-600">⏰ Expired: {stats.expired || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waitlist Entries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Current Waitlist</h3>
        {waitlist.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No one on the waitlist</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waitlist.map((entry, index) => (
                  <tr key={entry._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{entry.position || index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{entry.user?.name}</div>
                      <div className="text-xs text-gray-500">{entry.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.ticketType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        entry.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        entry.status === 'notified' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'converted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {analytics.recentActivity?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {analytics.recentActivity?.map(activity => (
              <div key={activity._id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <span className="font-medium">{activity.user?.name}</span>
                  <span className="text-gray-500 text-sm ml-2">joined waitlist for</span>
                  <span className="font-medium text-sm ml-1">{activity.ticketType}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

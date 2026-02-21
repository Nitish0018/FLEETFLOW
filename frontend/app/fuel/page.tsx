'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainNav } from '@/components/MainNav';

interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  litres: number;
  cost: number;
  date: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
  };
  trip?: {
    id: string;
    origin: string;
    destination: string;
  };
}

interface MonthlyTrend {
  month: string;
  totalCost: number;
  totalLitres: number;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
}

export default function FuelPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    tripId: '',
    litres: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetchFuelLogs();
    fetchMonthlyTrend();
    fetchVehicles();
  }, []);

  const fetchFuelLogs = async () => {
    try {
      const response = await api.get('/fuel');
      setFuelLogs(response.data.fuelLogs || []);
    } catch (error) {
      console.error('Failed to fetch fuel logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTrend = async () => {
    try {
      const response = await api.get('/fuel/stats/monthly-trend');
      setMonthlyTrend(response.data || []);
    } catch (error) {
      console.error('Failed to fetch monthly trend:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fuel', {
        vehicleId: formData.vehicleId,
        tripId: formData.tripId || undefined,
        litres: parseFloat(formData.litres),
        cost: parseFloat(formData.cost),
        date: new Date(formData.date),
      });
      setShowAddModal(false);
      setFormData({
        vehicleId: '',
        tripId: '',
        litres: '',
        cost: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchFuelLogs();
      fetchMonthlyTrend();
    } catch (error) {
      console.error('Failed to add fuel log:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fuel log?')) return;
    try {
      await api.delete(`/fuel/${id}`);
      fetchFuelLogs();
      fetchMonthlyTrend();
    } catch (error) {
      console.error('Failed to delete fuel log:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading fuel logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      <MainNav />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Fuel Logs</h1>
            <p className="text-gray-400">Track fuel consumption and costs</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#00C2FF] text-white px-6 py-3 rounded-lg hover:bg-[#00A8E0] transition-all"
          >
            + Add Fuel Log
          </button>
        </div>

        {/* Monthly Trend Chart */}
        {monthlyTrend.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F1629] rounded-xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Monthly Fuel Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1629',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalCost"
                  stroke="#00C2FF"
                  strokeWidth={2}
                  name="Total Cost ($)"
                />
                <Line
                  type="monotone"
                  dataKey="totalLitres"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Total Litres"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Fuel Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F1629] rounded-xl overflow-hidden"
        >
          <table className="w-full">
            <thead className="bg-[#1A1F35]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Trip</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Litres</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Cost</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Cost/L</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {fuelLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1A1F35] transition-colors">
                  <td className="px-6 py-4 text-sm text-white">
                    {format(new Date(log.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    <div>{log.vehicle.plateNumber}</div>
                    <div className="text-gray-400 text-xs">
                      {log.vehicle.make} {log.vehicle.model}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {log.trip ? `${log.trip.origin} → ${log.trip.destination}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{log.litres.toFixed(2)} L</td>
                  <td className="px-6 py-4 text-sm text-white">${log.cost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    ${(log.cost / log.litres).toFixed(2)}/L
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fuelLogs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No fuel logs found. Add your first fuel log to get started.
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Fuel Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1629] rounded-xl p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add Fuel Log</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Vehicle *
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1A1F35] text-white rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#00C2FF]"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Litres *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.litres}
                  onChange={(e) => setFormData({ ...formData, litres: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1A1F35] text-white rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#00C2FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Cost ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1A1F35] text-white rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#00C2FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1A1F35] text-white rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#00C2FF]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-[#1A1F35] text-white rounded-lg hover:bg-[#252B45] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#00C2FF] text-white rounded-lg hover:bg-[#00A8E0] transition-all"
                >
                  Add Fuel Log
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { MainNav } from '@/components/MainNav';

interface Expense {
  id: string;
  vehicleId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
  };
}

interface CategoryData {
  category: string;
  totalAmount: number;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
}

const EXPENSE_CATEGORIES = [
  'FUEL',
  'MAINTENANCE',
  'INSURANCE',
  'TAX',
  'REGISTRATION',
  'PARKING',
  'TOLL',
  'OTHER',
];

const COLORS = ['#00C2FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    category: 'OTHER',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetchExpenses();
    fetchCategoryData();
    fetchVehicles();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await api.get('/expenses/stats/by-category');
      setCategoryData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch category data:', error);
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
      await api.post('/expenses', {
        vehicleId: formData.vehicleId,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: new Date(formData.date),
      });
      setShowAddModal(false);
      setFormData({
        vehicleId: '',
        category: 'OTHER',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
      fetchCategoryData();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      fetchCategoryData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading expenses...</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Expenses</h1>
            <p className="text-gray-400">Track and manage operational expenses</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#00C2FF] text-white px-6 py-3 rounded-lg hover:bg-[#00A8E0] transition-all"
          >
            + Add Expense
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-br from-[#00C2FF]/20 to-[#0F1629] border border-[#00C2FF]/30 rounded-xl p-6"
          >
            <h3 className="text-gray-400 text-sm mb-2">Total Expenses</h3>
            <p className="text-3xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-linear-to-br from-[#10B981]/20 to-[#0F1629] border border-[#10B981]/30 rounded-xl p-6"
          >
            <h3 className="text-gray-400 text-sm mb-2">Total Categories</h3>
            <p className="text-3xl font-bold text-white">{categoryData.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-linear-to-br from-[#F59E0B]/20 to-[#0F1629] border border-[#F59E0B]/30 rounded-xl p-6"
          >
            <h3 className="text-gray-400 text-sm mb-2">Average Expense</h3>
            <p className="text-3xl font-bold text-white">
              ${expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
            </p>
          </motion.div>
        </div>

        {/* Category Breakdown Chart */}
        {categoryData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F1629] rounded-xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Expense Breakdown by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="totalAmount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1629',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Expenses Table */}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-[#1A1F35] transition-colors">
                  <td className="px-6 py-4 text-sm text-white">
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    <div>{expense.vehicle.plateNumber}</div>
                    <div className="text-gray-400 text-xs">
                      {expense.vehicle.make} {expense.vehicle.model}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#00C2FF]/20 text-[#00C2FF]">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-semibold">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No expenses found. Add your first expense to get started.
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1629] rounded-xl p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Add Expense</h2>
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
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1A1F35] text-white rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#00C2FF]"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-[#1A1F35] text-white rounded-lg border border-[#1E293B] focus:outline-none focus:border-[#00C2FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
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
                  Add Expense
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

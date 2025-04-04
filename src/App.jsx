import { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import axios from "axios";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

function App() {
  const [expenses, setExpenses] = useState(
    () => JSON.parse(localStorage.getItem("expenses")) || []
  );
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount) return;
    const expenseDate = date ? new Date(date) : new Date();
    if (editIndex !== null) {
      const updatedExpenses = [...expenses];
      updatedExpenses[editIndex] = {
        category,
        amount: Number(amount),
        date: expenseDate,
      };
      setExpenses(updatedExpenses);
      setEditIndex(null);
    } else {
      setExpenses([
        ...expenses,
        { category, amount: Number(amount), date: expenseDate },
      ]);
    }
    setCategory("");
    setAmount("");
    setDate("");
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setCategory(expenses[index].category);
    setAmount(expenses[index].amount);
    setDate(new Date(expenses[index].date).toISOString().split("T")[0]);
  };

  const handleDelete = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setCategory("");
      setAmount("");
      setDate("");
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && end) return expDate >= start && expDate <= end;
    if (start) return expDate >= start;
    if (end) return expDate <= end;
    return true;
  });

  const totalSpending = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const avgWeeklySpend = filteredExpenses.length
    ? totalSpending / (filteredExpenses.length / 7 || 1)
    : 0;

  const getPieChartData = () => {
    const categories = [
      ...new Set(filteredExpenses.map((exp) => exp.category)),
    ];
    const amounts = categories.map((cat) =>
      filteredExpenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0)
    );
    return {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: ["#34D399", "#A78BFA", "#FBBF24", "#60A5FA"],
          borderWidth: 1,
        },
      ],
    };
  };

  const getBarChartData = () => {
    const weeklyTotals = filteredExpenses.reduce((acc, exp) => {
      const week = Math.floor(
        (new Date() - new Date(exp.date)) / (7 * 24 * 60 * 60 * 1000)
      );
      acc[week] = (acc[week] || 0) + exp.amount;
      return acc;
    }, {});
    const labels = Object.keys(weeklyTotals).map(
      (week) => `Week ${Number(week) + 1}`
    );
    const data = Object.values(weeklyTotals);
    return {
      labels,
      datasets: [
        {
          label: "Spending ($)",
          data,
          backgroundColor: "#A78BFA",
          borderColor: "#7C3AED",
          borderWidth: 1,
        },
      ],
    };
  };

  const fetchPrediction = async () => {
    const weeklyTotals = expenses.reduce((acc, exp) => {
      const week = Math.floor(
        (new Date() - new Date(exp.date)) / (7 * 24 * 60 * 60 * 1000)
      );
      acc[week] = (acc[week] || 0) + exp.amount;
      return acc;
    }, {});
    const totals = Object.values(weeklyTotals).map((total) => ({
      amount: total,
    }));
    if (totals.length >= 2) {
      try {
        const response = await axios.post(
          "https://finance-tracker-backend-production-576f.up.railway.app/predict",
          { expenses: totals }
        );
        setPrediction(response.data.prediction);
      } catch (error) {
        setPrediction("Error fetching prediction");
      }
    } else {
      setPrediction("Need at least 2 weeks of data");
    }
  };

  const isFormValid = category && amount;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 p-6 bg-gray-800 shadow-xl flex flex-col animate-slide-in">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-teal-400">
            Finance Tracker
          </h1>
          <button
            onClick={() => setShowInfo(true)}
            className="bg-purple-500 px-3 py-1 rounded-lg hover:bg-purple-400 transition duration-300 animate-pulse text-sm"
          >
            ?
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 transition duration-200"
            >
              <option value="">Select</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 transition duration-200"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 transition duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full p-3 rounded-lg transition duration-300 font-semibold ${
              isFormValid
                ? "bg-teal-500 hover:bg-teal-400"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            {editIndex !== null ? "Update Expense" : "Add Expense"}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full bg-purple-500 p-3 rounded-lg hover:bg-purple-400 transition duration-300 font-semibold flex justify-between items-center"
          >
            Filter by Date
            <span>{isFilterOpen ? "▲" : "▼"}</span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isFilterOpen ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-400 transition duration-200"
                />
              </div>
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setIsFilterOpen(false);
                }}
                className="w-full bg-gray-600 p-3 rounded-lg hover:bg-gray-500 transition duration-300 font-semibold"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-700 p-4 rounded-lg animate-fade-in">
          <h3 className="text-lg font-semibold text-teal-400">
            Spending Summary
          </h3>
          <p className="text-gray-300">
            Total:{" "}
            <span className="font-bold text-teal-300">
              ${totalSpending.toFixed(2)}
            </span>
          </p>
          <p className="text-gray-300">
            Avg. Weekly:{" "}
            <span className="font-bold text-teal-300">
              ${avgWeeklySpend.toFixed(2)}
            </span>
          </p>
        </div>

        {totalSpending > 500 && (
          <div className="mt-4 bg-red-500/20 p-4 rounded-lg animate-fade-in text-center">
            <p className="text-red-300 font-semibold">
              Warning: Spending exceeds $500!
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full md:w-2/3 p-6 flex flex-col space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg animate-slide-in">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              Category Breakdown
            </h2>
            <div className="h-80">
              {filteredExpenses.length ? (
                <Pie
                  data={getPieChartData()}
                  options={{ maintainAspectRatio: false }}
                />
              ) : (
                <p className="text-gray-400 mt-20 text-center">No data yet!</p>
              )}
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg animate-slide-in">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              Weekly Spending
            </h2>
            <div className="h-80">
              {filteredExpenses.length ? (
                <Bar
                  data={getBarChartData()}
                  options={{
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              ) : (
                <p className="text-gray-400 mt-20 text-center">No data yet!</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl shadow-lg animate-slide-in">
          <h2 className="text-xl font-semibold mb-4 text-teal-400">
            Previous Spendings
          </h2>
          {filteredExpenses.length ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="p-2">Date</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-700 transition duration-200"
                    >
                      <td className="p-2">
                        {new Date(exp.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-2">{exp.category}</td>
                      <td className="p-2">${exp.amount.toFixed(2)}</td>
                      <td className="p-2 flex space-x-2">
                        <button
                          onClick={() => handleEdit(expenses.indexOf(exp))}
                          className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400 transition duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expenses.indexOf(exp))}
                          className="bg-red-500 px-2 py-1 rounded hover:bg-red-400 transition duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No expenses yet!</p>
          )}
          <button
            onClick={fetchPrediction}
            className="mt-4 w-full bg-purple-500 p-3 rounded-lg hover:bg-purple-400 transition duration-300 font-semibold"
          >
            Predict Next Week
          </button>
          {prediction && (
            <div className="mt-4 bg-gray-700 p-4 rounded-lg text-center animate-fade-in">
              <p className="text-teal-300">
                Next Week Prediction:{" "}
                <span className="font-bold">${prediction}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-fade-in">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full animate-slide-in">
            <h2 className="text-2xl font-bold mb-4 text-teal-400">
              How to Use Finance Tracker
            </h2>
            <ul className="space-y-2 text-gray-300">
              <li>
                1. <span className="font-semibold">Add Expenses</span>: Pick a
                category, enter an amount, and choose a date (or use today).
              </li>
              <li>
                2. <span className="font-semibold">Filter</span>: Use the date
                filter to narrow down your view.
              </li>
              <li>
                3. <span className="font-semibold">Visualize</span>: Check
                spending by category and week in the charts.
              </li>
              <li>
                4. <span className="font-semibold">Predict</span>: Add 2+ weeks
                of data, then click "Predict Next Week."
              </li>
            </ul>
            <button
              onClick={() => setShowInfo(false)}
              className="mt-6 w-full bg-teal-500 p-3 rounded-lg hover:bg-teal-400 transition duration-300"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

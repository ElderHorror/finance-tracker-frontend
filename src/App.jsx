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
  const [editIndex, setEditIndex] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !amount) return; // Prevent submission if either is empty
    if (editIndex !== null) {
      const updatedExpenses = [...expenses];
      updatedExpenses[editIndex] = {
        category,
        amount: Number(amount),
        date: new Date(expenses[editIndex].date),
      };
      setExpenses(updatedExpenses);
      setEditIndex(null);
    } else {
      setExpenses([
        ...expenses,
        { category, amount: Number(amount), date: new Date() },
      ]);
    }
    setCategory("");
    setAmount("");
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setCategory(expenses[index].category);
    setAmount(expenses[index].amount);
  };

  const handleDelete = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setCategory("");
      setAmount("");
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
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
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
          backgroundColor: "#3B82F6",
          borderColor: "#1E40AF",
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
          "https://finance-tracker-backend.up.railway.app/predict",
          { expenses: totals }
        );
        setPrediction(response.data.prediction);
      } catch (error) {
        console.error("Prediction error:", error);
        setPrediction("Error fetching prediction");
      }
    } else {
      setPrediction("Need at least 2 weeks of data");
    }
  };

  const totalSpending = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const isFormValid = category && amount; // Button enabled only if both are filled

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 text-white flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 p-6 bg-blue-800/80 backdrop-blur-md shadow-xl flex flex-col">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-center md:text-left">
          Finance Dashboard
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 mt-1 bg-blue-900/50 border border-blue-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 transition duration-200"
            >
              <option value="">Select</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 mt-1 bg-blue-900/50 border border-blue-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 transition duration-200"
              placeholder="Enter amount"
            />
          </div>
          <button
            type="submit"
            disabled={!isFormValid} // Disable if category or amount is empty
            className={`w-full p-3 rounded-lg transition duration-300 font-semibold ${
              isFormValid
                ? "bg-blue-500 hover:bg-blue-400"
                : "bg-gray-500 cursor-not-allowed"
            }`}
          >
            {editIndex !== null ? "Update Expense" : "Add Expense"}
          </button>
        </form>

        {/* Collapsible Filter */}
        <div className="mt-6">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full bg-blue-600 p-3 rounded-lg hover:bg-blue-500 transition duration-300 font-semibold flex justify-between items-center"
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
                <label className="block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 mt-1 bg-blue-900/50 border border-blue-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 mt-1 bg-blue-900/50 border border-blue-600 rounded-lg text-white focus:ring-2 focus:ring-blue-400 transition duration-200"
                />
              </div>
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setIsFilterOpen(false);
                }}
                className="w-full bg-gray-500 p-3 rounded-lg hover:bg-gray-400 transition duration-300 font-semibold"
              >
                Clear Filter
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-900/50 rounded-lg">
          <h3 className="text-lg font-semibold">Total Spending</h3>
          <p className="text-2xl font-bold text-blue-200">
            ${totalSpending.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-2/3 p-4 md:p-8 flex flex-col space-y-8">
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
            <div className="h-64">
              {filteredExpenses.length > 0 ? (
                <Pie
                  data={getPieChartData()}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              ) : (
                <p className="text-blue-200 text-center mt-20">
                  No expenses in this range!
                </p>
              )}
            </div>
          </div>
          <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-4">Weekly Spending</h2>
            <div className="h-64">
              {filteredExpenses.length > 0 ? (
                <Bar
                  data={getBarChartData()}
                  options={{
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              ) : (
                <p className="text-blue-200 text-center mt-20">
                  No expenses in this range!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Previous Spendings + Prediction */}
        <div className="bg-white/10 p-6 rounded-xl shadow-lg backdrop-blur-md animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Previous Spendings</h2>
          {filteredExpenses.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-600">
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
                      className="hover:bg-blue-700/50 transition duration-200"
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
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-400 transition duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expenses.indexOf(exp))}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-400 transition duration-200"
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
            <p className="text-blue-200">No expenses in this range!</p>
          )}
          <div className="mt-6 flex flex-col items-center space-y-4">
            <button
              onClick={fetchPrediction}
              className="w-full md:w-1/2 bg-green-500 p-3 rounded-lg hover:bg-green-400 transition duration-300 font-semibold"
            >
              Predict Next Week
            </button>
            {prediction && (
              <div className="bg-blue-900/50 p-4 rounded-lg shadow-md w-full md:w-1/2 text-center animate-fade-in">
                <p className="text-lg">
                  Next week’s predicted spend:{" "}
                  <span className="font-bold text-green-300">
                    ${prediction}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

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
  const [categories, setCategories] = useState(
    () =>
      JSON.parse(localStorage.getItem("categories")) || [
        "Food",
        "Transport",
        "Rent",
        "Other",
      ]
  );
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [modalType, setModalType] = useState(""); // "expense", "category", or "budget"
  const [budget, setBudget] = useState(
    () => Number(localStorage.getItem("budget")) || 1000
  );
  const [newCategory, setNewCategory] = useState("");
  const [view, setView] = useState("home");
  const [chartPeriod, setChartPeriod] = useState("monthly");
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("budget", budget);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [expenses, categories, budget, isDarkMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === "expense") {
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
    } else if (modalType === "category") {
      if (newCategory && !categories.includes(newCategory)) {
        setCategories([...categories, newCategory]);
        setNewCategory("");
      }
    }
    setShowAddModal(false);
    setModalType("");
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setCategory(expenses[index].category);
    setAmount(expenses[index].amount);
    setDate(new Date(expenses[index].date).toISOString().split("T")[0]);
    setModalType("expense");
    setShowAddModal(true);
  };

  const handleDelete = (index) => {
    setExpenses(expenses.filter((_, i) => i !== index));
    if (editIndex === index)
      setEditIndex(null), setCategory(""), setAmount(""), setDate("");
  };

  const deleteCategory = (cat) => {
    if (expenses.some((exp) => exp.category === cat)) return;
    setCategories(categories.filter((c) => c !== cat));
  };

  const filteredExpenses = expenses.filter((exp) => {
    const expDate = new Date(exp.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesDate =
      start && end
        ? expDate >= start && expDate <= end
        : start
        ? expDate >= start
        : end
        ? expDate <= end
        : true;
    const matchesCategory = selectedCategory
      ? exp.category === selectedCategory
      : true;
    return matchesDate && matchesCategory;
  });

  const totalSpending = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const getPieChartData = () => {
    const cats = [...new Set(filteredExpenses.map((exp) => exp.category))];
    const amounts = cats.map((cat) =>
      filteredExpenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0)
    );
    return {
      labels: cats,
      datasets: [
        {
          data: amounts,
          backgroundColor: ["#34D399", "#F472B6", "#FBBF24", "#60A5FA"],
          borderWidth: 1,
        },
      ],
    };
  };

  const getBarChartData = () => {
    let labels, data;
    if (chartPeriod === "daily") {
      const dailyTotals = filteredExpenses.reduce((acc, exp) => {
        const day = new Date(exp.date).toLocaleDateString("default", {
          month: "short",
          day: "numeric",
        });
        acc[day] = (acc[day] || 0) + exp.amount;
        return acc;
      }, {});
      labels = Object.keys(dailyTotals);
      data = Object.values(dailyTotals);
    } else if (chartPeriod === "yearly") {
      const yearlyTotals = filteredExpenses.reduce((acc, exp) => {
        const year = new Date(exp.date).getFullYear();
        acc[year] = (acc[year] || 0) + exp.amount;
        return acc;
      }, {});
      labels = Object.keys(yearlyTotals);
      data = Object.values(yearlyTotals);
    } else {
      const monthlyTotals = filteredExpenses.reduce((acc, exp) => {
        const month = new Date(exp.date).toLocaleString("default", {
          month: "short",
        });
        acc[month] = (acc[month] || 0) + exp.amount;
        return acc;
      }, {});
      labels = Object.keys(monthlyTotals);
      data = Object.values(monthlyTotals);
    }
    return {
      labels,
      datasets: [
        {
          label: "Spending ($)",
          data,
          backgroundColor: "#34D399",
          borderColor: "#10B981",
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
        setPrediction("Error fetching prediction");
      }
    } else {
      setPrediction("Need at least 2 weeks of data");
    }
  };

  const exportCSV = () => {
    const csv = [
      "Date,Category,Amount",
      ...filteredExpenses.map(
        (exp) =>
          `${new Date(exp.date).toLocaleDateString()},${exp.category},${
            exp.amount
          }`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Insights Calculations
  const highestSpendingCategory = () => {
    const categoryTotals = categories.map((cat) => ({
      category: cat,
      total: expenses
        .filter((exp) => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0),
    }));
    const highest = categoryTotals.reduce(
      (max, curr) => (curr.total > max.total ? curr : max),
      { category: "None", total: 0 }
    );
    return highest.category !== "None"
      ? `${highest.category} ($${highest.total.toFixed(2)})`
      : "No spending yet";
  };

  const averageDailySpending = () => {
    if (!expenses.length) return 0;
    const days = [
      ...new Set(
        expenses.map((exp) => new Date(exp.date).toLocaleDateString())
      ),
    ].length;
    return (totalSpending / days).toFixed(2);
  };

  const mostActiveDay = () => {
    const dayCounts = expenses.reduce((acc, exp) => {
      const day = new Date(exp.date).toLocaleString("default", {
        weekday: "long",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const mostActive = Object.entries(dayCounts).reduce(
      (max, curr) => (curr[1] > max[1] ? curr : max),
      ["None", 0]
    );
    return mostActive[0] !== "None" ? mostActive[0] : "No data yet";
  };

  const isFormValid =
    modalType === "expense"
      ? category && amount
      : modalType === "category"
      ? newCategory
      : true;

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } font-sans flex flex-col md:flex-row transition-colors duration-300`}
    >
      {/* Sidebar (Desktop) / Top Section (Mobile) */}
      {(view === "home" || view === "budget") && (
        <div
          className={`w-full md:w-1/3 p-4 md:p-6 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-lg flex flex-col`}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">FinanceFlow</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                {isDarkMode ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    ></path>
                  </svg>
                )}
              </button>
              <button className="text-gray-500 hover:text-gray-300 cursor-pointer">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Add Expense Button (PC Only) */}
          <button
            onClick={() => {
              setModalType("expense");
              setShowAddModal(true);
            }}
            className="w-full bg-teal-500 text-white p-3 rounded-lg hover:bg-teal-400 transition duration-200 cursor-pointer mb-6 md:block hidden"
          >
            Add Expense
          </button>

          {/* Budget Overview */}
          <div
            className={`p-4 rounded-xl shadow-sm mb-6 ${
              isDarkMode ? "bg-gray-700" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold mb-2">Planned Expenses</h2>
            <p className="text-3xl font-bold">${totalSpending.toFixed(2)}</p>
            <div className="mt-4 space-y-2 max-h-24 overflow-y-auto">
              {getPieChartData().labels.map((label, idx) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center">
                    <span
                      className="w-4 h-4 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          getPieChartData().datasets[0].backgroundColor[idx],
                      }}
                    ></span>
                    <span>{label}</span>
                  </div>
                  <span className="font-medium">
                    {(
                      (getPieChartData().datasets[0].data[idx] /
                        totalSpending) *
                        100 || 0
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Goal (PC Only) */}
          <div
            className={`p-4 rounded-xl shadow-sm mb-6 ${
              isDarkMode ? "bg-gray-700" : "bg-white"
            } md:block hidden`}
          >
            <h3 className="text-lg font-semibold mb-2">Budget Goal</h3>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className={`w-full p-2 border ${
                isDarkMode
                  ? "border-gray-600 bg-gray-800 text-gray-100"
                  : "border-gray-300 bg-white text-gray-900"
              } rounded-lg focus:ring-2 focus:ring-teal-400`}
              placeholder="Set monthly budget"
            />
            <p className="text-sm mt-2">
              Spent:{" "}
              <span
                className={
                  totalSpending > budget ? "text-red-500" : "text-teal-500"
                }
              >
                ${totalSpending.toFixed(2)} / ${budget}
              </span>
            </p>
          </div>

          {/* Categories (PC Only) */}
          <div
            className={`p-4 rounded-xl shadow-sm ${
              isDarkMode ? "bg-gray-700" : "bg-white"
            } md:block hidden`}
          >
            <h3 className="text-lg font-semibold mb-2">Categories</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategory && !categories.includes(newCategory)) {
                  setCategories([...categories, newCategory]);
                  setNewCategory("");
                }
              }}
              className="flex space-x-2 mb-4"
            >
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className={`flex-1 p-2 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-800 text-gray-100"
                    : "border-gray-300 bg-white text-gray-900"
                } rounded-lg focus:ring-2 focus:ring-teal-400`}
                placeholder="New category"
              />
              <button
                type="submit"
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-400 transition duration-200 cursor-pointer"
              >
                Add
              </button>
            </form>
            <ul className="space-y-2 max-h-24 overflow-y-auto">
              {categories.map((cat) => (
                <li
                  key={cat}
                  className={`flex justify-between items-center p-2 rounded-lg ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-100"
                  } text-sm`}
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => deleteCategory(cat)}
                    className={`text-white px-2 py-1 rounded-full text-xs transition duration-200 cursor-pointer ${
                      expenses.some((exp) => exp.category === cat)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-400"
                    }`}
                    disabled={expenses.some((exp) => exp.category === cat)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full md:w-2/3 p-4 md:p-6 flex flex-col space-y-6 pb-20 md:pb-6">
        {view === "home" && !showAllExpenses && (
          <>
            {/* Recent Activities */}
            <div
              className={`p-4 rounded-xl shadow-sm ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Recent Activities</h2>
                <button
                  onClick={() => setShowAllExpenses(true)}
                  className="text-teal-500 text-sm font-medium cursor-pointer hover:text-teal-400 transition duration-200"
                >
                  View All
                </button>
              </div>
              {filteredExpenses.length ? (
                <ul className="space-y-4">
                  {filteredExpenses.slice(0, 3).map((exp, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center">
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 9V7a5 5 0 00-10 0v2m-2 0h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z"
                            ></path>
                          </svg>
                        </span>
                        <div>
                          <p className="font-medium">{exp.category}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(exp.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">-${exp.amount.toFixed(2)}</p>
                        <button
                          onClick={() => handleEdit(expenses.indexOf(exp))}
                          className="text-gray-500 hover:text-gray-400 cursor-pointer transition duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                            ></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(expenses.indexOf(exp))}
                          className="text-red-500 hover:text-red-400 cursor-pointer transition duration-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center">
                  No recent activities
                </p>
              )}
            </div>

            {/* Insights */}
            <div
              className={`p-4 rounded-xl shadow-sm ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Insights</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setChartPeriod("daily")}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer transition duration-200 ${
                      chartPeriod === "daily"
                        ? "bg-teal-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    } hover:bg-teal-400 hover:text-white`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setChartPeriod("monthly")}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer transition duration-200 ${
                      chartPeriod === "monthly"
                        ? "bg-teal-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    } hover:bg-teal-400 hover:text-white`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartPeriod("yearly")}
                    className={`px-3 py-1 rounded-full text-sm cursor-pointer transition duration-200 ${
                      chartPeriod === "yearly"
                        ? "bg-teal-500 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    } hover:bg-teal-400 hover:text-white`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="flex space-x-2 mb-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`p-2 border ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-800 text-gray-100"
                      : "border-gray-300 bg-white text-gray-900"
                  } rounded-lg focus:ring-2 focus:ring-teal-400`}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-64">
                {filteredExpenses.length ? (
                  <Bar
                    data={getBarChartData()}
                    options={{
                      maintainAspectRatio: false,
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <p className="text-gray-500 mt-20 text-center">
                    No data yet!
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {view === "home" && showAllExpenses && (
          <div
            className={`p-4 rounded-xl shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">All Expenses</h2>
              <button
                onClick={() => setShowAllExpenses(false)}
                className="text-teal-500 text-sm font-medium cursor-pointer hover:text-teal-400 transition duration-200"
              >
                Back
              </button>
            </div>
            {filteredExpenses.length ? (
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {filteredExpenses.map((exp, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 9V7a5 5 0 00-10 0v2m-2 0h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z"
                          ></path>
                        </svg>
                      </span>
                      <div>
                        <p className="font-medium">{exp.category}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(exp.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">-${exp.amount.toFixed(2)}</p>
                      <button
                        onClick={() => handleEdit(expenses.indexOf(exp))}
                        className="text-gray-500 hover:text-gray-400 cursor-pointer transition duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(expenses.indexOf(exp))}
                        className="text-red-500 hover:text-red-400 cursor-pointer transition duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No expenses yet!</p>
            )}
          </div>
        )}

        {view === "insights" && (
          <div
            className={`p-4 rounded-xl shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
            <div className="flex space-x-2 mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`p-2 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-800 text-gray-100"
                    : "border-gray-300 bg-white text-gray-900"
                } rounded-lg focus:ring-2 focus:ring-teal-400`}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-64">
              {filteredExpenses.length ? (
                <Pie
                  data={getPieChartData()}
                  options={{ maintainAspectRatio: false }}
                />
              ) : (
                <p className="text-gray-500 mt-20 text-center">No data yet!</p>
              )}
            </div>
            <button
              onClick={fetchPrediction}
              className="mt-4 w-full bg-teal-500 text-white p-3 rounded-lg hover:bg-teal-400 transition duration-300 font-semibold cursor-pointer"
            >
              Predict Next Week
            </button>
            {prediction && (
              <div
                className={`mt-4 p-4 rounded-lg text-center animate-fade-in ${
                  isDarkMode ? "bg-teal-900" : "bg-teal-50"
                }`}
              >
                <p className="text-teal-600">
                  Next Week Prediction:{" "}
                  <span className="font-bold">${prediction}</span>
                </p>
              </div>
            )}
            {/* Fun Insights */}
            <div className="mt-6 space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <h3 className="text-sm font-medium">
                  Highest Spending Category
                </h3>
                <p className="text-lg font-semibold">
                  {highestSpendingCategory()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <h3 className="text-sm font-medium">Average Daily Spending</h3>
                <p className="text-lg font-semibold">
                  ${averageDailySpending()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <h3 className="text-sm font-medium">
                  Most Active Spending Day
                </h3>
                <p className="text-lg font-semibold">{mostActiveDay()}</p>
              </div>
            </div>
          </div>
        )}

        {view === "budget" && (
          <div
            className={`p-4 rounded-xl shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold mb-4">Spending Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Filter by Date
                </label>
                <div className="flex space-x-2 mt-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`flex-1 p-2 border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    } rounded-lg focus:ring-2 focus:ring-teal-400`}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`flex-1 p-2 border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    } rounded-lg focus:ring-2 focus:ring-teal-400`}
                  />
                </div>
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className={`mt-2 w-full p-2 rounded-lg transition duration-200 cursor-pointer ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  Clear Filter
                </button>
              </div>
              <button
                onClick={exportCSV}
                className="w-full bg-teal-500 text-white p-3 rounded-lg hover:bg-teal-400 transition duration-200 cursor-pointer"
              >
                Export as CSV
              </button>
            </div>
          </div>
        )}

        {view === "settings" && (
          <div
            className={`p-4 rounded-xl shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Dark Mode</span>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-12 h-6 rounded-full p-1 flex items-center transition duration-200 cursor-pointer ${
                    isDarkMode ? "bg-teal-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      isDarkMode ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB Options Popup (Mobile) */}
      {showFabOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-fade-in">
          <div
            className={`p-4 rounded-xl shadow-lg w-64 ${
              isDarkMode
                ? "bg-gray-800 text-gray-100"
                : "bg-white text-gray-900"
            }`}
          >
            <button
              onClick={() => {
                setModalType("expense");
                setShowAddModal(true);
                setShowFabOptions(false);
              }}
              className="w-full p-3 text-left hover:bg-teal-500 hover:text-white rounded-lg transition duration-200 cursor-pointer"
            >
              Add Expense
            </button>
            <button
              onClick={() => {
                setModalType("category");
                setShowAddModal(true);
                setShowFabOptions(false);
              }}
              className="w-full p-3 text-left hover:bg-teal-500 hover:text-white rounded-lg transition duration-200 cursor-pointer"
            >
              Add Category
            </button>
            <button
              onClick={() => {
                setModalType("budget");
                setShowAddModal(true);
                setShowFabOptions(false);
              }}
              className="w-full p-3 text-left hover:bg-teal-500 hover:text-white rounded-lg transition duration-200 cursor-pointer"
            >
              Change Budget
            </button>
            <button
              onClick={() => setShowFabOptions(false)}
              className={`w-full p-3 text-left rounded-lg transition duration-200 cursor-pointer ${
                isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Expense/Category/Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-fade-in">
          <div
            className={`p-6 rounded-xl shadow-lg max-w-md w-full animate-slide-in ${
              isDarkMode
                ? "bg-gray-800 text-gray-100"
                : "bg-white text-gray-900"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">
              {modalType === "expense"
                ? editIndex !== null
                  ? "Edit Expense"
                  : "Add Expense"
                : modalType === "category"
                ? "Add Category"
                : "Change Budget"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === "expense" && (
                <>
                  <div>
                    <label className="block text-sm font-medium">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full p-3 mt-1 border ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-800 text-gray-100"
                          : "border-gray-300 bg-white text-gray-900"
                      } rounded-lg focus:ring-2 focus:ring-teal-400 transition duration-200`}
                    >
                      <option value="">Select</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full p-3 mt-1 border ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-800 text-gray-100"
                          : "border-gray-300 bg-white text-gray-900"
                      } rounded-lg focus:ring-2 focus:ring-teal-400 transition duration-200`}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`w-full p-3 mt-1 border ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-800 text-gray-100"
                          : "border-gray-300 bg-white text-gray-900"
                      } rounded-lg focus:ring-2 focus:ring-teal-400 transition duration-200`}
                    />
                  </div>
                </>
              )}
              {modalType === "category" && (
                <div>
                  <label className="block text-sm font-medium">
                    New Category
                  </label>
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className={`w-full p-3 mt-1 border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    } rounded-lg focus:ring-2 focus:ring-teal-400 transition duration-200`}
                    placeholder="Enter category name"
                  />
                </div>
              )}
              {modalType === "budget" && (
                <div>
                  <label className="block text-sm font-medium">
                    Monthly Budget ($)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className={`w-full p-3 mt-1 border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-800 text-gray-100"
                        : "border-gray-300 bg-white text-gray-900"
                    } rounded-lg focus:ring-2 focus:ring-teal-400 transition duration-200`}
                    placeholder="Set monthly budget"
                  />
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`flex-1 p-3 rounded-lg transition duration-300 font-semibold cursor-pointer ${
                    isFormValid
                      ? "bg-teal-500 text-white hover:bg-teal-400"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {modalType === "expense"
                    ? editIndex !== null
                      ? "Update"
                      : "Add"
                    : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setModalType("");
                  }}
                  className={`flex-1 p-3 rounded-lg transition duration-200 cursor-pointer ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 shadow-lg p-4 flex justify-around items-center ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <button
          onClick={() => {
            setView("home");
            setShowAllExpenses(false);
          }}
          className={`flex flex-col items-center cursor-pointer ${
            view === "home" ? "text-teal-500" : "text-gray-500"
          } hover:text-teal-400 transition duration-200`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7m-9 9v-6h6v6m-9-9h12"
            ></path>
          </svg>
          <span className="text-xs mt-1">Home</span>
        </button>
        <button
          onClick={() => setView("insights")}
          className={`flex flex-col items-center cursor-pointer ${
            view === "insights" ? "text-teal-500" : "text-gray-500"
          } hover:text-teal-400 transition duration-200`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          <span className="text-xs mt-1">Insights</span>
        </button>
        <button
          onClick={() => setShowFabOptions(true)}
          className="bg-teal-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-8 cursor-pointer hover:bg-teal-400 transition duration-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
        </button>
        <button
          onClick={() => setView("budget")}
          className={`flex flex-col items-center cursor-pointer ${
            view === "budget" ? "text-teal-500" : "text-gray-500"
          } hover:text-teal-400 transition duration-200`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.686 1M12 8c-1.11 0-2.08.402-2.686 1M12 16c1.11 0 2.08-.402 2.686-1M12 16c-1.11 0-2.08-.402-2.686-1M3 12h18"
            ></path>
          </svg>
          <span className="text-xs mt-1">Spending</span>
        </button>
        <button
          onClick={() => setView("settings")}
          className={`flex flex-col items-center cursor-pointer ${
            view === "settings" ? "text-teal-500" : "text-gray-500"
          } hover:text-teal-400 transition duration-200`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
}

export default App;

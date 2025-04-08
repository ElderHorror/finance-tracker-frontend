import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Animation variants for the hero section
const heroVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

// Animation variants for the feature cards
const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

// Animation for the CTA button
const buttonVariants = {
  hover: { scale: 1.1, boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.2)", transition: { duration: 0.3 } },
  tap: { scale: 0.95 },
};

function LandingPage() {
  const navigate = useNavigate();
  const [isDarkMode] = useState(localStorage.getItem("theme") === "dark");

  return (
    <div
      className={`min-h-screen font-sans flex flex-col ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      } overflow-x-hidden`}
    >
      {/* Hero Section */}
      <section
        className={`relative flex flex-col items-center justify-center py-20 px-4 md:py-32 ${
          isDarkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-teal-500 to-blue-600"
        } text-center`}
      >
        {/* Background Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse-slow pointer-events-none"
        ></div>

        {/* Hero Content */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight relative z-10"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          Welcome to <span className="text-teal-300">FinanceFlow</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-2xl mb-10 max-w-2xl relative z-10"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          Track your expenses, manage your budget, and gain insights into your spending habits with ease.
        </motion.p>
        <motion.button
          onClick={() => navigate("/app")}
          className="bg-teal-500 text-white cursor-pointer px-8 py-4 rounded-full text-lg font-semibold hover:bg-teal-400 transition duration-300 relative z-10"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          Get Started
        </motion.button>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-10">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Why Choose FinanceFlow?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature Card 1 */}
          <motion.div
            className={`p-6 rounded-xl shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } hover:shadow-xl transition-shadow duration-300`}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
          >
            <div className="text-teal-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.686 1M12 8c-1.11 0-2.08.402-2.686 1M12 16c1.11 0 2.08-.402 2.686-1M12 16c-1.11 0-2.08-.402-2.686-1M3 12h18"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Expenses</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add, edit, and categorize your expenses effortlessly with a clean and intuitive interface.
            </p>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div
            className={`p-6 rounded-xl shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } hover:shadow-xl transition-shadow duration-300`}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-teal-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Set Budgets</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stay on top of your finances by setting monthly budget goals and tracking your progress.
            </p>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div
            className={`p-6 rounded-xl shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } hover:shadow-xl transition-shadow duration-300`}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-teal-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Gain Insights</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize your spending patterns with interactive charts and predictive analytics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-20 px-4 text-center ${
          isDarkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Ready to Take Control of Your Finances?
        </motion.h2>
        <motion.button
          onClick={() => navigate("/app")}
          className="bg-teal-500 text-white px-8 cursor-pointer py-4 rounded-full text-lg font-semibold hover:bg-teal-400 transition duration-300"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          Start Tracking Now
        </motion.button>
      </section>

      {/* Footer */}
      <footer className={`py-6 px-4 text-center ${isDarkMode ? "bg-gray-900" : "bg-gray-200"}`}>
        <p className="text-sm">
          Built by Adebayo |{" "}
          <a
            href="https://github.com/ElderHorror/finance-tracker-frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:underline"
          >
            GitHub
          </a>{" "}
          |{" "}
          <a
            href="https://adebayo-adedeji-portfolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:underline"
          >
            Portfolio
          </a>
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
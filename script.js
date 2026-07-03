// ===== Finance Dashboard - JavaScript =====

// ===== State Management =====
const state = {
  transactions: [],
  budget: 0,
  currentPage: "dashboard",
  currentFilter: "all",
  searchQuery: "",
  editingId: null,
  theme: localStorage.getItem("theme") || "light",
};

// ===== Initialize App =====
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

const initializeApp = () => {
  loadFromStorage();
  applyTheme();
  setupEventListeners();
  setCurrentDate();
  navigatePage("dashboard");
  updateDashboard();
};

// ===== Event Listeners =====
const setupEventListeners = () => {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      navigatePage(page);
    });
  });

  // Hamburger Menu
  const hamburger = document.getElementById("hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("active");
    });
  }

  // Close sidebar when clicking on main content
  document.querySelector(".main-content").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.remove("active");
  });

  // Theme Toggle
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document
    .getElementById("themeToggleSettings")
    ?.addEventListener("click", toggleTheme);

  // Transaction Form
  document
    .getElementById("transactionForm")
    .addEventListener("submit", handleAddTransaction);

  // Edit Modal
  document
    .getElementById("closeModal")
    .addEventListener("click", closeEditModal);
  document
    .getElementById("editForm")
    .addEventListener("submit", handleEditTransaction);
  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target.id === "editModal") closeEditModal();
  });

  // Confirm Modal
  document.getElementById("confirmModal").addEventListener("click", (e) => {
    if (e.target.id === "confirmModal") closeConfirmModal();
  });
  document
    .getElementById("confirmCancel")
    .addEventListener("click", closeConfirmModal);

  // Filter Buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      state.currentFilter = e.target.dataset.filter;
      renderTransactions();
    });
  });

  // Search
  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderTransactions();
  });

  // CSV Export
  document.getElementById("csvExport").addEventListener("click", exportToCSV);
  document
    .getElementById("settingsExport")
    .addEventListener("click", exportToCSV);

  // Budget
  document
    .getElementById("setBudgetBtn")
    .addEventListener("click", handleSetBudget);

  // Clear Data
  document
    .getElementById("clearDataBtn")
    .addEventListener("click", handleClearData);

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;
  document.getElementById("editDate").value = today;
};

// ===== Theme Management =====
const toggleTheme = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", state.theme);
  applyTheme();
};

const applyTheme = () => {
  const isDark = state.theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);

  const icon = document.getElementById("themeToggle").querySelector("i");
  icon.classList.toggle("fa-sun", !isDark);
  icon.classList.toggle("fa-moon", isDark);
};

// ===== Page Navigation =====
const navigatePage = (page) => {
  state.currentPage = page;

  // Update active nav link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  // Update active page
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(`${page}Page`).classList.add("active");

  // Page specific initialization
  switch (page) {
    case "dashboard":
      updateDashboard();
      break;
    case "transactions":
      renderTransactions();
      break;
    case "analytics":
      updateAnalytics();
      break;
    case "budget":
      updateBudget();
      break;
    case "settings":
      break;
  }

  // Scroll to top
  document.querySelector(".main-content").scrollTop = 0;
};

// ===== Transaction Management =====
const handleAddTransaction = (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const date = document.getElementById("date").value;

  // Validation
  if (!title || !amount || amount <= 0 || !category || !date) {
    showNotification("Please fill all fields correctly", "error");
    return;
  }

  const transaction = {
    id: Date.now(),
    title,
    amount,
    category,
    type,
    date,
    timestamp: new Date().toISOString(),
  };

  state.transactions.unshift(transaction);
  saveToStorage();

  // Reset form
  document.getElementById("transactionForm").reset();
  document.getElementById("date").value = new Date()
    .toISOString()
    .split("T")[0];

  showNotification("Transaction added successfully!", "success");
  updateDashboard();
  renderTransactions();
  updateAnalytics();
  updateBudget();
};

const handleEditTransaction = (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById("editId").value);
  const title = document.getElementById("editTitle").value.trim();
  const amount = parseFloat(document.getElementById("editAmount").value);
  const category = document.getElementById("editCategory").value;
  const type = document.getElementById("editType").value;
  const date = document.getElementById("editDate").value;

  if (!title || !amount || amount <= 0 || !category || !date) {
    showNotification("Please fill all fields correctly", "error");
    return;
  }

  const transaction = state.transactions.find((t) => t.id === id);
  if (transaction) {
    transaction.title = title;
    transaction.amount = amount;
    transaction.category = category;
    transaction.type = type;
    transaction.date = date;

    saveToStorage();
    closeEditModal();
    showNotification("Transaction updated successfully!", "success");
    updateDashboard();
    renderTransactions();
    updateAnalytics();
    updateBudget();
  }
};

const editTransaction = (id) => {
  const transaction = state.transactions.find((t) => t.id === id);
  if (!transaction) return;

  document.getElementById("editId").value = id;
  document.getElementById("editTitle").value = transaction.title;
  document.getElementById("editAmount").value = transaction.amount;
  document.getElementById("editCategory").value = transaction.category;
  document.getElementById("editType").value = transaction.type;
  document.getElementById("editDate").value = transaction.date;

  document.getElementById("editModal").classList.add("active");
};

const deleteTransaction = (id) => {
  showConfirmModal("Are you sure you want to delete this transaction?", () => {
    state.transactions = state.transactions.filter((t) => t.id !== id);
    saveToStorage();
    showNotification("Transaction deleted successfully!", "success");
    updateDashboard();
    renderTransactions();
    updateAnalytics();
    updateBudget();
  });
};

// ===== Render Transactions =====
const renderTransactions = () => {
  const container = document.getElementById("transactionsTableContainer");
  let filtered = filterTransactions();

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No transactions found</p>';
    return;
  }

  // Check if mobile
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    container.innerHTML = filtered
      .map(
        (t) => `
            <div class="transaction-card">
                <div class="transaction-card-info">
                    <div class="transaction-card-title">${escapeHtml(t.title)}</div>
                    <div class="transaction-card-meta">
                        <span class="category-badge">${t.category}</span>
                        <span style="margin-left: 8px;">${formatDate(t.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "-"}₹${formatCurrency(t.amount)}</div>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editTransaction(${t.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("");
  } else {
    const tableHtml = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered
                      .map(
                        (t) => `
                        <tr>
                            <td>${escapeHtml(t.title)}</td>
                            <td><span class="category-badge">${t.category}</span></td>
                            <td>${formatDate(t.date)}</td>
                            <td><span class="type-badge ${t.type}">${capitalize(t.type)}</span></td>
                            <td><span class="amount ${t.type}">${t.type === "income" ? "+" : "-"}₹${formatCurrency(t.amount)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-edit" onclick="editTransaction(${t.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
    container.innerHTML = tableHtml;
  }
};

// ===== Filter Transactions =====
const filterTransactions = () => {
  let filtered = state.transactions;

  // Filter by type
  if (state.currentFilter !== "all") {
    filtered = filtered.filter((t) => t.type === state.currentFilter);
  }

  // Filter by search
  if (state.searchQuery) {
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(state.searchQuery) ||
        t.category.toLowerCase().includes(state.searchQuery),
    );
  }

  return filtered;
};

// ===== Dashboard Update =====
const updateDashboard = () => {
  const { totalIncome, totalExpense, totalBalance } = calculateTotals();

  document.getElementById("totalBalance").textContent =
    `₹${formatCurrency(totalBalance)}`;
  document.getElementById("totalIncome").textContent =
    `₹${formatCurrency(totalIncome)}`;
  document.getElementById("totalExpenses").textContent =
    `₹${formatCurrency(totalExpense)}`;
  document.getElementById("totalSavings").textContent =
    `₹${formatCurrency(totalBalance - state.budget)}`;

  // Render recent transactions
  renderRecentTransactions();

  // Update charts
  updateDashboardCharts();
};

const renderRecentTransactions = () => {
  const container = document.getElementById("recentTransactions");
  const recent = state.transactions.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<p class="empty-state">No transactions yet</p>';
    return;
  }

  container.innerHTML = recent
    .map(
      (t) => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-title">${escapeHtml(t.title)}</div>
                <div class="transaction-meta">${t.category} • ${formatDate(t.date)}</div>
            </div>
            <div class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "-"}₹${formatCurrency(t.amount)}</div>
        </div>
    `,
    )
    .join("");
};

// ===== Charts =====
let expenseChart,
  incomeExpenseChart,
  analyticsExpenseChart,
  analyticsMonthlyChart;

const updateDashboardCharts = () => {
  updateExpenseChart();
  updateIncomeExpenseChart();
};

const updateExpenseChart = () => {
  const data = getCategoryExpenses();

  const ctx = document.getElementById("expenseChart");

  if (expenseChart) {
    expenseChart.data.labels = data.labels;
    expenseChart.data.datasets[0].data = data.amounts;
    expenseChart.data.datasets[0].backgroundColor = data.colors;
    expenseChart.update();
    return;
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.amounts,
          backgroundColor: data.colors,
          borderColor: getComputedStyle(
            document.documentElement,
          ).getPropertyValue("--bg-primary"),
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary",
            ),
            font: { size: 12, weight: "600" },
            padding: 15,
          },
        },
      },
    },
  });
};

const updateIncomeExpenseChart = () => {
  const data = getMonthlyData();

  const ctx = document.getElementById("incomeExpenseChart");

  if (incomeExpenseChart) {
    incomeExpenseChart.data.labels = data.labels;
    incomeExpenseChart.data.datasets[0].data = data.income;
    incomeExpenseChart.data.datasets[1].data = data.expense;
    incomeExpenseChart.update();
    return;
  }

  incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Income",
          data: data.income,
          backgroundColor: "#10b981",
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: "Expenses",
          data: data.expense,
          backgroundColor: "#ef4444",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary",
            ),
            font: { size: 12, weight: "600" },
            padding: 15,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-secondary",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-secondary",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
      },
    },
  });
};

const updateAnalyticsCharts = () => {
  updateAnalyticsExpenseChart();
  updateAnalyticsMonthlyChart();
};

const updateAnalyticsExpenseChart = () => {
  const data = getCategoryExpenses();

  const ctx = document.getElementById("analyticsExpenseChart");

  if (analyticsExpenseChart) {
    analyticsExpenseChart.data.labels = data.labels;
    analyticsExpenseChart.data.datasets[0].data = data.amounts;
    analyticsExpenseChart.data.datasets[0].backgroundColor = data.colors;
    analyticsExpenseChart.update();
    return;
  }

  analyticsExpenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.amounts,
          backgroundColor: data.colors,
          borderColor: getComputedStyle(
            document.documentElement,
          ).getPropertyValue("--bg-primary"),
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary",
            ),
            font: { size: 12, weight: "600" },
            padding: 20,
          },
        },
      },
    },
  });
};

const updateAnalyticsMonthlyChart = () => {
  const data = getMonthlyData();

  const ctx = document.getElementById("analyticsMonthlyChart");

  if (analyticsMonthlyChart) {
    analyticsMonthlyChart.data.labels = data.labels;
    analyticsMonthlyChart.data.datasets[0].data = data.income;
    analyticsMonthlyChart.data.datasets[1].data = data.expense;
    analyticsMonthlyChart.update();
    return;
  }

  analyticsMonthlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Income",
          data: data.income,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: "#10b981",
        },
        {
          label: "Expenses",
          data: data.expense,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: "#ef4444",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary",
            ),
            font: { size: 12, weight: "600" },
            padding: 15,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-secondary",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
        x: {
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-secondary",
            ),
          },
          grid: {
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--border-color",
            ),
          },
        },
      },
    },
  });
};

// ===== Analytics Page =====
const updateAnalytics = () => {
  const { totalIncome, totalExpense } = calculateTotals();
  const categories = getCategoryExpenses();
  const transactions = state.transactions;

  // Summary Stats
  document.getElementById("totalTransactions").textContent =
    transactions.length;

  const avgTransaction =
    transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
      : 0;
  document.getElementById("avgTransaction").textContent =
    `₹${formatCurrency(avgTransaction)}`;

  const expenses = transactions.filter((t) => t.type === "expense");
  const largestExpense =
    expenses.length > 0 ? Math.max(...expenses.map((t) => t.amount)) : 0;
  document.getElementById("largestExpense").textContent =
    `₹${formatCurrency(largestExpense)}`;

  const income = transactions.filter((t) => t.type === "income");
  const largestIncome =
    income.length > 0 ? Math.max(...income.map((t) => t.amount)) : 0;
  document.getElementById("largestIncome").textContent =
    `₹${formatCurrency(largestIncome)}`;

  // Category Breakdown
  renderCategoryBreakdown(categories);

  // Charts
  updateAnalyticsCharts();
};

const renderCategoryBreakdown = (data) => {
  const container = document.getElementById("categoriesList");

  if (data.labels.length === 0) {
    container.innerHTML =
      '<p class="empty-state">No expense data available</p>';
    return;
  }

  const total = data.amounts.reduce((a, b) => a + b, 0);

  container.innerHTML = data.labels
    .map((label, index) => {
      const percent =
        total > 0 ? ((data.amounts[index] / total) * 100).toFixed(1) : 0;
      return `
            <div class="category-item">
                <div class="category-name">
                    <div class="category-color" style="background-color: ${data.colors[index]}"></div>
                    <span>${label}</span>
                </div>
                <div class="category-stats">
                    <div class="category-amount">₹${formatCurrency(data.amounts[index])}</div>
                    <div class="category-percent">${percent}%</div>
                </div>
            </div>
        `;
    })
    .join("");
};

// ===== Budget Management =====
const handleSetBudget = () => {
  const budgetInput = document.getElementById("monthlyBudget");
  const budget = parseFloat(budgetInput.value);

  if (!budget || budget <= 0) {
    showNotification("Please enter a valid budget amount", "error");
    return;
  }

  state.budget = budget;
  saveToStorage();
  showNotification("Budget updated successfully!", "success");
  updateBudget();
};

const updateBudget = () => {
  const { totalExpense } = calculateTotals();
  const spent = totalExpense;
  const remaining = Math.max(0, state.budget - spent);
  const percent = state.budget > 0 ? (spent / state.budget) * 100 : 0;

  document.getElementById("monthlyBudget").value = state.budget;
  document.getElementById("budgetAmount").textContent =
    `₹${formatCurrency(state.budget)}`;
  document.getElementById("budgetSpent").textContent =
    `₹${formatCurrency(spent)}`;
  document.getElementById("budgetRemaining").textContent =
    `₹${formatCurrency(remaining)}`;

  const progressFill = document.getElementById("progressFill");
  progressFill.style.width = Math.min(100, percent) + "%";
  progressFill.style.background =
    percent > 100
      ? "linear-gradient(90deg, #ef4444, #f59e0b)"
      : percent > 80
        ? "linear-gradient(90deg, #f59e0b, #06b6d4)"
        : "linear-gradient(90deg, #10b981, #06b6d4)";

  document.getElementById("progressText").textContent =
    `${percent.toFixed(1)}% Used`;

  // Budget Warnings
  const warningsContainer = document.getElementById("budgetWarnings");
  let warningHtml = "";

  if (state.budget === 0) {
    warningHtml =
      '<p class="empty-state" style="padding: 1rem;">Set a budget to track your spending</p>';
  } else if (percent > 100) {
    warningHtml = `<div class="warning-message danger"><i class="fas fa-exclamation-circle"></i> You have exceeded your budget by ₹${formatCurrency(spent - state.budget)}</div>`;
  } else if (percent > 80) {
    warningHtml = `<div class="warning-message warning"><i class="fas fa-exclamation-triangle"></i> You have used 80% of your budget. Only ₹${formatCurrency(remaining)} left</div>`;
  } else if (percent > 50) {
    warningHtml = `<div class="warning-message warning"><i class="fas fa-info-circle"></i> You have used 50% of your budget</div>`;
  }

  warningsContainer.innerHTML = warningHtml;

  // Category Spending
  renderCategorySpending();
};

const renderCategorySpending = () => {
  const container = document.getElementById("categorySpending");
  const expenses = state.transactions.filter((t) => t.type === "expense");

  if (expenses.length === 0) {
    container.innerHTML =
      '<p class="empty-state">No spending data available</p>';
    return;
  }

  const categoryMap = {};
  expenses.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  container.innerHTML = sorted
    .map(
      ([category, amount]) => `
        <div class="spending-item">
            <span class="spending-name">${category}</span>
            <span class="spending-amount">₹${formatCurrency(amount)}</span>
        </div>
    `,
    )
    .join("");
};

// ===== Calculate Totals =====
const calculateTotals = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const thisMonthTransactions = state.transactions.filter((t) => {
    const transDate = new Date(t.date);
    return (
      transDate.getMonth() === currentMonth &&
      transDate.getFullYear() === currentYear
    );
  });

  const totalIncome = thisMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = thisMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeIncome = state.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeExpense = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = allTimeIncome - allTimeExpense;

  return { totalIncome, totalExpense, totalBalance };
};

// ===== Get Category Expenses =====
const getCategoryExpenses = () => {
  const expenses = state.transactions.filter((t) => t.type === "expense");
  const categoryMap = {};

  expenses.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const categories = Object.keys(categoryMap).sort(
    (a, b) => categoryMap[b] - categoryMap[a],
  );

  const colors = [
    "#6366f1",
    "#a855f7",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#6366f1",
    "#3b82f6",
  ];

  return {
    labels: categories,
    amounts: categories.map((cat) => categoryMap[cat]),
    colors: categories.map((_, i) => colors[i % colors.length]),
  };
};

// ===== Get Monthly Data =====
const getMonthlyData = () => {
  const months = [];
  const income = [];
  const expense = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const monthYear = `${month} ${year}`;
    months.push(monthYear);

    const monthTransactions = state.transactions.filter((t) => {
      const transDate = new Date(t.date);
      return (
        transDate.getMonth() === date.getMonth() &&
        transDate.getFullYear() === date.getFullYear()
      );
    });

    const monthIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    income.push(monthIncome);
    expense.push(monthExpense);
  }

  return { labels: months, income, expense };
};

// ===== Export to CSV =====
const exportToCSV = () => {
  if (state.transactions.length === 0) {
    showNotification("No transactions to export", "error");
    return;
  }

  const headers = ["Title", "Amount", "Category", "Type", "Date"];
  const rows = state.transactions.map((t) => [
    t.title,
    t.amount,
    t.category,
    t.type,
    t.date,
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv += row.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showNotification("CSV exported successfully!", "success");
};

// ===== Clear All Data =====
const handleClearData = () => {
  showConfirmModal(
    "Are you sure you want to delete all data? This action cannot be undone.",
    () => {
      state.transactions = [];
      state.budget = 0;
      saveToStorage();
      showNotification("All data cleared successfully!", "success");
      updateDashboard();
      renderTransactions();
      updateAnalytics();
      updateBudget();
    },
  );
};

// ===== Modal Management =====
const closeEditModal = () => {
  document.getElementById("editModal").classList.remove("active");
  document.getElementById("editForm").reset();
};

const showConfirmModal = (message, onConfirm) => {
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmOk").onclick = () => {
    onConfirm();
    closeConfirmModal();
  };
  document.getElementById("confirmModal").classList.add("active");
};

const closeConfirmModal = () => {
  document.getElementById("confirmModal").classList.remove("active");
};

// ===== Notifications =====
const showNotification = (message, type = "success") => {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === "success" ? "linear-gradient(135deg, #10b981, #06b6d4)" : "linear-gradient(135deg, #ef4444, #f59e0b)"};
        color: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        max-width: 400px;
    `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// ===== Utility Functions =====
const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2);
};

const formatDate = (dateString) => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const escapeHtml = (text) => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const setCurrentDate = () => {
  const today = new Date();
  const formatted = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("currentDate").textContent = formatted;
};

// ===== Local Storage =====
const saveToStorage = () => {
  localStorage.setItem(
    "financeDashboard",
    JSON.stringify({
      transactions: state.transactions,
      budget: state.budget,
    }),
  );
};

const loadFromStorage = () => {
  const saved = localStorage.getItem("financeDashboard");
  if (saved) {
    const data = JSON.parse(saved);
    state.transactions = data.transactions || [];
    state.budget = data.budget || 0;
  }
};

// ===== Handle Window Resize =====
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    document.querySelector(".sidebar").classList.remove("active");
  }
});

// ===== Add Slide Animations =====
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Global variables
let expenses = [];
let totalBudget = 50000;
let currentFilter = 'all';
let currentUser = null;
let editingExpenseId = null;
let monthlyGoal = null;
let dailyLimit = null;
let selectedDate = null; // Add this for date filtering

// Initialize on page load
window.onload = function() {
    checkAuthStatus();
};

// Authentication Functions
function checkAuthStatus() {
    // Note: localStorage is not available in Claude artifacts, using session variables instead
    if (currentUser) {
        showMainApp();
    } else {
        showAuthSection();
    }
}

function showAuthSection() {
    document.getElementById('auth-section').style.display = 'flex';
    document.getElementById('main-app').classList.remove('active');
}

function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').classList.add('active');
    document.getElementById('welcome-message').textContent = `Welcome back, ${currentUser.name}! 👋`;
    
    loadUserData();
    setTodayDate();
    loadCurrency();
    updateStats();
    updateBudgetDisplay();
    loadTheme();
    updateFormCurrency();
    loadGoal();
    loadDailyLimit();
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    clearAuthErrors();
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    clearAuthErrors();
}

function clearAuthErrors() {
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('register-error').style.display = 'none';
    document.getElementById('register-success').style.display = 'none';
}

// In-memory user storage (since localStorage isn't available in Claude artifacts)
// Pre-populate with some demo accounts for testing
let users = [
    {
        id: 1,
        name: "Demo User",
        email: "demo@example.com",
        password: "demo123",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Test User",
        email: "test@example.com", 
        password: "test123",
        createdAt: new Date().toISOString()
    }
];

function registerUser() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError('register-error', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showError('register-error', 'Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        showError('register-error', 'Password must be at least 6 characters long');
        return;
    }

    if (password !== confirmPassword) {
        showError('register-error', 'Passwords do not match');
        return;
    }

    // Check if user already exists
    if (users.find(user => user.email === email)) {
        showError('register-error', 'An account with this email already exists');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password, // In production, this should be hashed
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Show success message
    document.getElementById('register-success').innerHTML = `
        ✅ Account created successfully!<br>
        <strong>Your credentials:</strong><br>
        Email: ${email}<br>
        Password: ${password}
    `;
    document.getElementById('register-success').style.display = 'block';

    // Clear form
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';

    // Switch to login after 3 seconds
    setTimeout(() => {
        showLogin();
    }, 3000);
}

function loginUser() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showError('login-error', 'Please enter both email and password');
        return;
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showError('login-error', `Invalid email or password. Available accounts: ${users.length} registered users.`);
        console.log('Available users:', users.map(u => ({ email: u.email, password: u.password })));
        return;
    }

    // Set current user and show main app
    currentUser = user;
    showMainApp();

    // Clear login form
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        expenses = [];
        totalBudget = 50000;
        showAuthSection();
        showLogin();
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper: get localStorage key for a user
function getUserKey(email) {
    return `expenseflow_${email}`;
}

// Save current user's data to localStorage
function saveUserData() {
    if (!currentUser) return;
    const key = getUserKey(currentUser.email);
    localStorage.setItem(key, JSON.stringify({
        expenses,
        totalBudget
    }));
}

// Load current user's data from localStorage
function loadUserData() {
    if (!currentUser) return;
    const key = getUserKey(currentUser.email);
    const data = localStorage.getItem(key);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            expenses = parsed.expenses || [];
            totalBudget = parsed.totalBudget || 50000;
        } catch {
            expenses = [];
            totalBudget = 50000;
        }
    } else {
        expenses = [];
        totalBudget = 50000;
    }
}

// Set today's date
function setTodayDate() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById('date').value = dateString;
    document.getElementById('budgetAmount').value = totalBudget;
}

// Add expense function
function addExpense() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    // Validate inputs
    if (!amount || !category || !description || !date) {
        alert('Please fill in all fields');
        return;
    }

    if (parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Create expense object
    const expense = {
        id: Date.now(),
        amount: parseFloat(amount),
        category: category,
        description: description,
        date: date
    };

    // Add to expenses array
    expenses.unshift(expense);
    saveUserData();
    
    // Update UI
    updateStats();
    showSuccessMessage();
    clearForm();
    checkDailyLimitNotification();
}

// Clear form
function clearForm() {
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
    document.getElementById('description').value = '';
    setTodayDate();
}

// Show success message
function showSuccessMessage() {
    const message = document.getElementById('successMessage');
    message.style.display = 'block';
    setTimeout(() => {
        message.style.display = 'none';
    }, 3000);
}

// Update statistics
function updateStats() {
    const total = convertAmount(expenses.reduce((sum, expense) => sum + expense.amount, 0));
    const remaining = convertAmount(totalBudget) - total;

    // Calculate today's expenses
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = convertAmount(
        expenses.filter(expense => expense.date === today)
            .reduce((sum, expense) => sum + expense.amount, 0)
    );

    document.getElementById('todayExpenses').textContent = `${getCurrencySymbol()}${todayTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('totalExpenses').textContent = `${getCurrencySymbol()}${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('remaining').textContent = `${getCurrencySymbol()}${remaining.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    const remainingElement = document.getElementById('remaining');
    if (remaining < 0) {
        remainingElement.className = 'amount expense-amount';
    } else if (remaining < convertAmount(totalBudget) * 0.2) {
        remainingElement.className = 'amount expense-amount';
    } else {
        remainingElement.className = 'amount balance-amount';
    }

    // Update dashboard goals - use current variables that are kept in sync
    updateDashboardGoals();
}

// Separate function to update dashboard goal values
function updateDashboardGoals() {
    // Monthly Savings Goal
    const monthlyGoalElem = document.getElementById('dashboardMonthlyGoal');
    if (monthlyGoal != null && !isNaN(monthlyGoal) && monthlyGoal > 0) {
        monthlyGoalElem.textContent = `${getCurrencySymbol()}${convertAmount(monthlyGoal).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
        monthlyGoalElem.className = 'amount dashboard-goal-amount';
    } else {
        monthlyGoalElem.textContent = `${getCurrencySymbol()}0.00`;
        monthlyGoalElem.className = 'amount dashboard-goal-amount';
    }
    
    // Daily Expense Limit
    const dailyLimitElem = document.getElementById('dashboardDailyLimit');
    if (dailyLimit != null && !isNaN(dailyLimit) && dailyLimit > 0) {
        dailyLimitElem.textContent = `${getCurrencySymbol()}${convertAmount(dailyLimit).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
        dailyLimitElem.className = 'amount dashboard-limit-amount';
    } else {
        dailyLimitElem.textContent = `${getCurrencySymbol()}0.00`;
        dailyLimitElem.className = 'amount dashboard-limit-amount';
    }
}

// Update budget
function updateBudget() {
    const newBudget = document.getElementById('budgetAmount').value;
    if (newBudget && parseFloat(newBudget) > 0) {
        totalBudget = parseFloat(newBudget);
        saveUserData();
        updateStats();
        updateBudgetDisplay();
        alert('Budget updated successfully!');
    } else {
        alert('Please enter a valid budget amount');
    }
}

// Update budget display
function updateBudgetDisplay() {
    document.getElementById('currentBudgetDisplay').textContent = convertAmount(totalBudget).toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('monthlyBudget').textContent = `${getCurrencySymbol()}${convertAmount(totalBudget).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

// Navigation function
function showSection(sectionId, event) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Support both inline onclick and programmatic calls
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // fallback: activate the button matching the section
        const btns = document.querySelectorAll('.nav-btn');
        btns.forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(sectionId)) {
                btn.classList.add('active');
            }
        });
    }

    // Update content based on section
    if (sectionId === 'recent-expenses') {
        setDefaultDateFilter();
        renderExpenses(currentFilter);
    } else if (sectionId === 'spending-overview') {
        showChart('category');
    } else if (sectionId === 'goals-challenges') {
        updateGoalProgress();
    } else if (sectionId === 'expense-insights') {
        showExpenseInsights();
    }
}

// Currency conversion rates (demo, not real-time)
const currencyRates = {
    INR: { symbol: '₹', rate: 1 },
    USD: { symbol: '$', rate: 0.012 },
    EUR: { symbol: '€', rate: 0.011 }
};
let selectedCurrency = 'INR';

function getUserCurrencyKey(email) {
    return `expenseflow_currency_${email}`;
}

function loadCurrency() {
    if (!currentUser) return;
    const key = getUserCurrencyKey(currentUser.email);
    const saved = localStorage.getItem(key);
    selectedCurrency = saved || 'INR';
    document.getElementById('currencySelect').value = selectedCurrency;
}

function saveCurrency() {
    if (!currentUser) return;
    const key = getUserCurrencyKey(currentUser.email);
    localStorage.setItem(key, selectedCurrency);
}

function changeCurrency() {
    selectedCurrency = document.getElementById('currencySelect').value;
    saveCurrency();
    updateStats();
    updateBudgetDisplay();
    updateFormCurrency();
    drawChart();
}

function convertAmount(amount) {
    const rate = currencyRates[selectedCurrency].rate;
    return amount * rate;
}

function getCurrencySymbol() {
    return currencyRates[selectedCurrency].symbol;
}

// Update all amount displays to use selected currency
function updateStats() {
    const total = convertAmount(expenses.reduce((sum, expense) => sum + expense.amount, 0));
    const remaining = convertAmount(totalBudget) - total;

    // Calculate today's expenses
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = convertAmount(
        expenses.filter(expense => expense.date === today)
            .reduce((sum, expense) => sum + expense.amount, 0)
    );

    document.getElementById('todayExpenses').textContent = `${getCurrencySymbol()}${todayTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('totalExpenses').textContent = `${getCurrencySymbol()}${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('remaining').textContent = `${getCurrencySymbol()}${remaining.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    const remainingElement = document.getElementById('remaining');
    if (remaining < 0) {
        remainingElement.className = 'amount expense-amount';
    } else if (remaining < convertAmount(totalBudget) * 0.2) {
        remainingElement.className = 'amount expense-amount';
    } else {
        remainingElement.className = 'amount balance-amount';
    }
}

// Update budget display
function updateBudgetDisplay() {
    document.getElementById('currentBudgetDisplay').textContent = convertAmount(totalBudget).toLocaleString('en-IN', {minimumFractionDigits: 2});
    document.getElementById('monthlyBudget').textContent = `${getCurrencySymbol()}${convertAmount(totalBudget).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

// Update currency symbol in forms
function updateFormCurrency() {
    document.querySelectorAll('label[for="amount"], label[for="editAmount"]').forEach(label => {
        label.innerHTML = `Amount (${getCurrencySymbol()})`;
    });
    document.querySelectorAll('label[for="budgetAmount"]').forEach(label => {
        label.innerHTML = `Set Monthly Budget (${getCurrencySymbol()})`;
    });
}

// Update renderExpenses to show converted amounts
function renderExpenses(filter = 'all') {
    const container = document.getElementById('expensesList');
    let filteredExpenses = expenses;
    
    // Filter by date first (if date is selected)
    if (selectedDate) {
        filteredExpenses = filteredExpenses.filter(e => e.date === selectedDate);
    }
    
    // Then filter by category
    if (filter !== 'all') {
        filteredExpenses = filteredExpenses.filter(e => e.category === filter);
    }
    
    if (filteredExpenses.length === 0) {
        const dateText = selectedDate ? ` for ${formatDate(selectedDate)}` : '';
        const categoryText = filter !== 'all' ? ` in ${formatCategoryName(filter)}` : '';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>No expenses found</h3>
                <p>${filter === 'all' && !selectedDate ? 'Add your first expense to get started!' : `No expenses found${dateText}${categoryText}.`}</p>
            </div>
        `;
        return;
    }
    container.innerHTML = filteredExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-description">${expense.description}</div>
                <div class="expense-meta">${getCategoryIcon(expense.category)} ${formatCategoryName(expense.category)} • ${formatDate(expense.date)}</div>
            </div>
            <div class="expense-actions">
                <div class="expense-amount-display">${getCurrencySymbol()}${convertAmount(expense.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                <button class="edit-btn" onclick="editExpense(${expense.id})">✏</button>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">🗑</button>
            </div>
        </div>
    `).join('');
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        food: '🍽',
        transport: '🚗',
        shopping: '🛍',
        entertainment: '🎬',
        bills: '💡',
        health: '🏥',
        education: '📚',
        travel: '✈',
        other: '📝'
    };
    return icons[category] || '📝';
}

// Format category name
function formatCategoryName(category) {
    const names = {
        food: 'Food & Dining',
        transport: 'Transportation',
        shopping: 'Shopping',
        entertainment: 'Entertainment',
        bills: 'Bills & Utilities',
        health: 'Healthcare',
        education: 'Education',
        travel: 'Travel',
        other: 'Other'
    };
    return names[category] || 'Other';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveUserData();
        updateStats();
        renderExpenses(currentFilter);
        drawChart();
        checkDailyLimitNotification();
    }
}

// Edit expense
function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    editingExpenseId = id;
    
    // Populate the edit form
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editCategory').value = expense.category;
    document.getElementById('editDescription').value = expense.description;
    document.getElementById('editDate').value = expense.date;
    
    // Show the modal
    document.getElementById('editModal').style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingExpenseId = null;
}

// Save expense changes
function saveExpenseChanges() {
    if (!editingExpenseId) return;

    const amount = document.getElementById('editAmount').value;
    const category = document.getElementById('editCategory').value;
    const description = document.getElementById('editDescription').value;
    const date = document.getElementById('editDate').value;

    // Validate inputs
    if (!amount || !category || !description || !date) {
        alert('Please fill in all fields');
        return;
    }

    if (parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Find and update the expense
    const expenseIndex = expenses.findIndex(e => e.id === editingExpenseId);
    if (expenseIndex !== -1) {
        expenses[expenseIndex] = {
            ...expenses[expenseIndex],
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: date
        };
        saveUserData();
        // Update UI
        updateStats();
        renderExpenses(currentFilter);
        drawChart();
        closeEditModal();
        checkDailyLimitNotification();
        alert('Expense updated successfully!');
    }
}

// Filter expenses
function filterExpenses(category) {
    currentFilter = category;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    renderExpenses(category);
}

// Set default date filter to today
function setDefaultDateFilter() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    selectedDate = today;
}

// Filter expenses by selected date
function filterExpensesByDate() {
    selectedDate = document.getElementById('dateFilter').value;
    renderExpenses(currentFilter);
}

// Clear date filter and show all expenses
function clearDateFilter() {
    selectedDate = null;
    document.getElementById('dateFilter').value = '';
    renderExpenses(currentFilter);
}

// Chart toggle logic
function showChart(type) {
    const btnCat = document.getElementById('btnCategoryBreakdown');
    const btnMonth = document.getElementById('btnMonthlyComparison');
    const catWrap = document.getElementById('categoryChartWrapper');
    const monthWrap = document.getElementById('monthlyChartWrapper');
    if (type === 'category') {
        catWrap.style.display = '';
        monthWrap.style.display = 'none';
        btnCat.classList.add('active');
        btnMonth.classList.remove('active');
        drawChart();
    } else {
        catWrap.style.display = 'none';
        monthWrap.style.display = '';
        btnCat.classList.remove('active');
        btnMonth.classList.add('active');
        drawMonthlyBarChart();
    }
}

// Draw pie chart with date-wise spending
function drawChart() {
    const canvas = document.getElementById('spendingChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (expenses.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '18px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('No spending data available', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '14px Segoe UI';
        ctx.fillText('Add some expenses to see your spending breakdown', canvas.width/2, canvas.height/2 + 10);
        return;
    }
    // Group by date
    const dateTotals = {};
    expenses.forEach(expense => {
        dateTotals[expense.date] = (dateTotals[expense.date] || 0) + convertAmount(expense.amount);
    });
    const dates = Object.keys(dateTotals).sort();
    const total = Object.values(dateTotals).reduce((sum, val) => sum + val, 0);
    const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6'];
    // Pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 30;
    const radius = Math.min(centerX, centerY) - 60;
    let currentAngle = -Math.PI / 2;
    dates.forEach((date, index) => {
        const sliceAngle = (dateTotals[date] / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Date label and percentage
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        const percentage = ((dateTotals[date] / total) * 100).toFixed(1);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 13px Segoe UI';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(formatDate(date), labelX, labelY - 5);
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillText(`${percentage}%`, labelX, labelY + 10);
        ctx.shadowBlur = 0;
        currentAngle += sliceAngle;
    });
    // Legend
    const legendStartY = canvas.height - 100;
    const legendItemHeight = 22;
    dates.forEach((date, index) => {
        const legendX = 30 + (index % 3) * 180;
        const legendY = legendStartY + Math.floor(index / 3) * legendItemHeight;
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(legendX, legendY, 15, 15);
        ctx.fillStyle = '#333';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'left';
        ctx.fillText(`${formatDate(date)} - ${getCurrencySymbol()}${dateTotals[date].toLocaleString('en-IN')}`, legendX + 20, legendY + 12);
    });
    // Total in center
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Total Spent', centerX, centerY - 10);
    ctx.font = 'bold 20px Segoe UI';
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`${getCurrencySymbol()}${total.toLocaleString('en-IN')}`, centerX, centerY + 15);
}

// Draw bar chart for monthly expenses
function drawMonthlyBarChart() {
    const canvas = document.getElementById('monthlyBarChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (expenses.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '18px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('No monthly data available', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '14px Segoe UI';
        ctx.fillText('Add expenses to compare months', canvas.width/2, canvas.height/2 + 10);
        return;
    }
    // Group expenses by month
    const monthlyTotals = {};
    expenses.forEach(expense => {
        const d = new Date(expense.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        monthlyTotals[key] = (monthlyTotals[key] || 0) + convertAmount(expense.amount);
    });
    const months = Object.keys(monthlyTotals).sort();
    const values = months.map(m => monthlyTotals[m]);
    const maxValue = Math.max(...values, 1);
    // Bar chart dimensions
    const chartWidth = canvas.width - 80;
    const chartHeight = canvas.height - 60;
    const barWidth = Math.min(40, chartWidth / months.length - 10);
    const startX = 60;
    const startY = canvas.height - 40;
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + chartWidth, startY);
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY - chartHeight);
    ctx.stroke();
    // Draw bars
    months.forEach((month, i) => {
        const x = startX + i * (barWidth + 20);
        const barHeight = (values[i] / maxValue) * (chartHeight - 20);
        ctx.fillStyle = '#667eea';
        ctx.fillRect(x, startY - barHeight, barWidth, barHeight);
        // Month label
        const [year, m] = month.split('-');
        const label = `${new Date(year, m-1).toLocaleString('en-IN', { month: 'short' })} '${year.slice(-2)}`;
        ctx.fillStyle = '#333';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + barWidth/2, startY + 18);
        // Value label
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillText(`${getCurrencySymbol()}${values[i].toLocaleString('en-IN', {maximumFractionDigits:2})}`, x + barWidth/2, startY - barHeight - 8);
    });
    // Chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Monthly Expenses Comparison', canvas.width/2, 30);
}

// Goals & Challenges logic
function getUserGoalKey(email) {
    return `expenseflow_goal_${email}`;
}
function loadGoal() {
    if (!currentUser) return;
    const key = getUserGoalKey(currentUser.email);
    const saved = localStorage.getItem(key);
    monthlyGoal = saved ? parseFloat(saved) : null;
    updateGoalProgress();
    updateDashboardGoals();
    updateStats(); // Ensure dashboard updates after loading goal
}
function saveGoal() {
    if (!currentUser) return;
    const key = getUserGoalKey(currentUser.email);
    localStorage.setItem(key, monthlyGoal);
}
function updateGoal() {
    const val = document.getElementById('goalAmount').value;
    if (val && parseFloat(val) > 0) {
        monthlyGoal = parseFloat(val);
        saveGoal();
        updateGoalProgress();
        updateDashboardGoals();
        updateStats(); // Update dashboard immediately
        alert('Goal updated!');
    } else {
        alert('Please enter a valid goal amount');
    }
}
function updateGoalProgress() {
    const goalDisplay = document.getElementById('currentGoalDisplay');
    if (monthlyGoal) {
        goalDisplay.textContent = `${getCurrencySymbol()}${monthlyGoal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    } else {
        goalDisplay.textContent = 'None';
    }
    // Calculate savings progress
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
    }).reduce((sum, e) => sum + convertAmount(e.amount), 0);
    const savings = monthlyGoal ? Math.max(monthlyGoal - monthExpenses, 0) : 0;
    const percent = monthlyGoal ? Math.min((savings / monthlyGoal) * 100, 100) : 0;
    const fill = document.getElementById('goalProgressFill');
    fill.style.width = monthlyGoal ? `${percent}%` : '0';
    fill.textContent = monthlyGoal ? `${percent.toFixed(1)}%` : '';
    const progressText = document.getElementById('goalProgressText');
    if (monthlyGoal) {
        progressText.textContent = `Saved: ${getCurrencySymbol()}${savings.toLocaleString('en-IN', {minimumFractionDigits:2})} / Goal: ${getCurrencySymbol()}${monthlyGoal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    } else {
        progressText.textContent = 'Set a goal to track your savings progress!';
    }
}

// Load goal on login
function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').classList.add('active');
    document.getElementById('welcome-message').textContent = `Welcome back, ${currentUser.name}! 👋`;
    loadUserData();
    setTodayDate();
    loadCurrency();
    updateStats();
    updateBudgetDisplay();
    loadTheme();
    updateFormCurrency();
    loadGoal();
    loadDailyLimit();
}

// Export to CSV
function exportToCSV() {
    if (expenses.length === 0) {
        alert('No expenses to export!');
        return;
    }

    const headers = ['Date', 'Category', 'Description', 'Amount'];
    const csvContent = [
        headers.join(','),
        ...expenses.map(expense => [
            formatDate(expense.date),
            formatCategoryName(expense.category),
            `"${expense.description}"`,
            expense.amount
        ].join(','))
    ].join('\n');

    // Add current date to filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${currentUser.name.replace(' ', '_')}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert('Expenses exported successfully!');
}

// Theme toggle logic (fix: actually toggle dark mode and persist)
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    // Optionally persist theme
    if (currentUser) {
        localStorage.setItem(`expenseflow_theme_${currentUser.email}`, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }
}

// Load theme on login
function loadTheme() {
    if (currentUser) {
        const theme = localStorage.getItem(`expenseflow_theme_${currentUser.email}`);
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('themeToggle').checked = false;
        }
    }
}

// Milestones & Rewards logic
let milestoneBadges = [];
let milestonePoints = 0;

function updateMilestonesAndRewards() {
    milestoneBadges = [];
    milestonePoints = 0;
    // Saved 100% of goal
    if (monthlyGoal) {
        const month = new Date().getMonth();
        const year = new Date().getFullYear();
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === month && d.getFullYear() === year;
        }).reduce((sum, e) => sum + convertAmount(e.amount), 0);
        if (monthExpenses <= monthlyGoal) {
            milestoneBadges.push({ icon: "🏆", label: "Goal Achiever" });
            milestonePoints += 100;
        } else if (monthExpenses <= monthlyGoal * 1.5) {
            milestoneBadges.push({ icon: "🥈", label: "Almost There" });
            milestonePoints += 50;
        }
        milestoneBadges.push({ icon: "🎯", label: "Goal Set" });
        milestonePoints += 10;
    }
    // No spend day
    const today = new Date().toISOString().split('T')[0];
    const todaySpent = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
    if (todaySpent === 0) {
        milestoneBadges.push({ icon: "🛡️", label: "No Spend Day" });
        milestonePoints += 5;
    }
    // Added 10 expenses
    if (expenses.length >= 10) {
        milestoneBadges.push({ icon: "📈", label: "Expense Tracker" });
        milestonePoints += 20;
    }
    // Spent less than budget
    const totalSpent = expenses.reduce((sum, e) => sum + convertAmount(e.amount), 0);
    if (totalSpent < convertAmount(totalBudget)) {
        milestoneBadges.push({ icon: "💰", label: "Budget Keeper" });
        milestonePoints += 30;
    }
    // Used multi-currency
    if (selectedCurrency !== 'INR') {
        milestoneBadges.push({ icon: "🌐", label: "Multi-Currency User" });
        milestonePoints += 10;
    }
    // Render badges and points
    const badgeDiv = document.getElementById('milestoneBadges');
    badgeDiv.innerHTML = milestoneBadges.map(b => `<span style="font-size:2rem;" title="${b.label}">${b.icon}</span>`).join('');
    document.getElementById('milestonePoints').textContent = `Points: ${milestonePoints}`;
}

// Daily Expense Limit logic
function getUserDailyLimitKey(email) {
    return `expenseflow_daily_limit_${email}`;
}
function loadDailyLimit() {
    if (!currentUser) return;
    const key = getUserDailyLimitKey(currentUser.email);
    const saved = localStorage.getItem(key);
    dailyLimit = saved ? parseFloat(saved) : null;
    updateDailyLimitDisplay();
    checkDailyLimitNotification();
    updateDashboardGoals();
    updateStats(); // Ensure dashboard updates after loading daily limit
}
function saveDailyLimit() {
    if (!currentUser) return;
    const key = getUserDailyLimitKey(currentUser.email);
    localStorage.setItem(key, dailyLimit);
}
function updateDailyLimit() {
    const val = document.getElementById('dailyLimit').value;
    if (val && parseFloat(val) > 0) {
        dailyLimit = parseFloat(val);
        saveDailyLimit();
        updateDailyLimitDisplay();
        checkDailyLimitNotification();
        updateDashboardGoals();
        updateStats(); // Update dashboard immediately
        alert('Daily limit updated!');
    } else {
        alert('Please enter a valid daily limit');
    }
}
function updateDailyLimitDisplay() {
    document.getElementById('currentDailyLimitDisplay').textContent =
        dailyLimit ? `${getCurrencySymbol()}${dailyLimit.toLocaleString('en-IN', {minimumFractionDigits:2})}` : 'None';
}
function checkDailyLimitNotification() {
    const today = new Date().toISOString().split('T')[0];
    const todaySpent = expenses.filter(e => e.date === today).reduce((sum, e) => sum + convertAmount(e.amount), 0);
    const notif = document.getElementById('dailyLimitNotification');
    if (dailyLimit && todaySpent > dailyLimit) {
        notif.style.display = 'block';
        notif.textContent = `⚠️ You have exceeded your daily limit of ${getCurrencySymbol()}${dailyLimit.toLocaleString('en-IN', {minimumFractionDigits:2})}! Today's spending: ${getCurrencySymbol()}${todaySpent.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    } else {
        notif.style.display = 'none';
        notif.textContent = '';
    }
}

// Call checkDailyLimitNotification after adding expense
function addExpense() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    // Validate inputs
    if (!amount || !category || !description || !date) {
        alert('Please fill in all fields');
        return;
    }

    if (parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Create expense object
    const expense = {
        id: Date.now(),
        amount: parseFloat(amount),
        category: category,
        description: description,
        date: date
    };

    // Add to expenses array
    expenses.unshift(expense);
    saveUserData();
    
    // Update UI
    updateStats();
    showSuccessMessage();
    clearForm();
    checkDailyLimitNotification();
}

// Call checkDailyLimitNotification after deleting expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveUserData();
        updateStats();
        renderExpenses(currentFilter);
        drawChart();
        checkDailyLimitNotification();
    }
}

// Call checkDailyLimitNotification after editing expense
function saveExpenseChanges() {
    if (!editingExpenseId) return;

    const amount = document.getElementById('editAmount').value;
    const category = document.getElementById('editCategory').value;
    const description = document.getElementById('editDescription').value;
    const date = document.getElementById('editDate').value;

    // Validate inputs
    if (!amount || !category || !description || !date) {
        alert('Please fill in all fields');
        return;
    }

    if (parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Find and update the expense
    const expenseIndex = expenses.findIndex(e => e.id === editingExpenseId);
    if (expenseIndex !== -1) {
        expenses[expenseIndex] = {
            ...expenses[expenseIndex],
            amount: parseFloat(amount),
            category: category,
            description: description,
            date: date
        };
        saveUserData();
        // Update UI
        updateStats();
        renderExpenses(currentFilter);
        drawChart();
        closeEditModal();
        checkDailyLimitNotification();
        alert('Expense updated successfully!');
    }
}

// Load daily limit on login
function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-app').classList.add('active');
    document.getElementById('welcome-message').textContent = `Welcome back, ${currentUser.name}! 👋`;
    loadUserData();
    setTodayDate();
    loadCurrency();
    updateStats();
    updateBudgetDisplay();
    loadTheme();
    updateFormCurrency();
    loadGoal();
    loadDailyLimit();
}

// Add/Update Budget and Add Expense form toggling
function showBudgetForm() {
    document.getElementById('budgetForm').style.display = '';
    document.getElementById('expenseForm').style.display = 'none';
    document.getElementById('showBudgetBtn').classList.add('active');
    document.getElementById('showExpenseBtn').classList.remove('active');
}
function showExpenseForm() {
    document.getElementById('budgetForm').style.display = 'none';
    document.getElementById('expenseForm').style.display = '';
    document.getElementById('showBudgetBtn').classList.remove('active');
    document.getElementById('showExpenseBtn').classList.add('active');
}

// Show only expense form by default on section load
document.addEventListener('DOMContentLoaded', function() {
    showExpenseForm();
}); 
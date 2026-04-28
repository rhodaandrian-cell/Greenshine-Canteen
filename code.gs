// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// code.gs — Google Apps Script Backend
// Sheet ID: 1VJMCSAGes7ffBTF8P6xwn37g3spg9pa9wZ0_bXHDY-c
// ============================================================

// ---------- SHEET NAMES ----------
const SHEET_REGISTER     = "Student Register";
const SHEET_TRANSACTIONS = "Canteen Transactions";
const SHEET_BALANCES     = "Canteen Balances";

// ---------- MENU PRICES ----------
const PRICE_FOOD     = 50;
const PRICE_TEA      = 15;
const PRICE_PORRIDGE = 10;

// ---------- TYPE THRESHOLDS ----------
// 0 = Unranked (no transactions yet)
// A = Prepaid  (has topped up, positive balance)
// B = Weekly Tab (paid within last 7 days)
// C = Occasional (paid before but >7 days ago)
// D = Non-paying (meals but zero payment history)

// ============================================================
// DIAGNOSTIC FUNCTIONS — run manually from Apps Script
// ============================================================
function testDiagnose() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Student Register");
  Logger.log("Sheet found: " + (sheet !== null));
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    Logger.log("Total rows: " + data.length);
    Logger.log("First row: "  + JSON.stringify(data[0]));
    Logger.log("Second row: " + JSON.stringify(data[1]));
  }
}

function testGetStudents() {
  var result = getStudents();
  Logger.log("Student count: " + result.students.length);
  Logger.log("First student: " + JSON.stringify(result.students[0]));
}

function testPost() {
  // Simulates what the frontend will send as a POST request
  var e = {
    postData: {
      contents: JSON.stringify({ action: "getStudents" }),
      type: "application/json"
    }
  };
  var result = handleRequest(e);
  Logger.log(result.getContent().substring(0, 500));
}

function testDashboard() {
  var e = {
    postData: {
      contents: JSON.stringify({ action: "getDashboard" }),
      type: "application/json"
    }
  };
  var result = handleRequest(e);
  Logger.log(result.getContent().substring(0, 500));
}

// ============================================================
// WEB APP ENTRY POINTS
// doGet — returns a simple status page (browser visits)
// doPost — all real requests from the frontend use POST
// ============================================================
function doGet(e) {
  var html = "<h2>Greenshine Academy — Canteen API</h2>"
           + "<p>Status: <strong style='color:green'>Online</strong></p>"
           + "<p>Send POST requests with a JSON body: <code>{action: 'getStudents'}</code></p>"
           + "<p>Available actions: getStudents, getBalances, getTransactions, getDashboard, "
           + "recordPayment, recordMeal, recordBulkMeals, getWatchlist, getReports</p>";
  return HtmlService.createHtmlOutput(html);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var result;
  try {
    var params = {};
    var action = "";

    // Read from POST body
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
      action = params.action || "";
    }

    if (!action) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: "No action provided",
          tip  : "Send a POST request with body: {action: 'getStudents'}"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    switch (action) {
      case "getStudents":     result = getStudents();                 break;
      case "getBalances":     result = getBalances();                 break;
      case "getTransactions": result = getTransactions(params.admNo); break;
      case "getDashboard":    result = getDashboard();                break;
      case "recordPayment":   result = recordPayment(params);         break;
      case "recordMeal":      result = recordMeal(params);            break;
      case "recordBulkMeals": result = recordBulkMeals(params);       break;
      case "getWatchlist":    result = getWatchlist();                break;
      case "getReports":         result = getReports(params);             break;
      case "checkTodayMeals":   result = checkTodayMeals(params);        break;
      default: result = { error: "Unknown action: " + action };
    }
  } catch (err) {
    result = { error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// 1. GET STUDENTS
// ============================================================
function getStudents() {
  var sheet    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REGISTER);
  var data     = sheet.getDataRange().getValues();
  var students = [];

  for (var i = 1; i < data.length; i++) {
    var row      = data[i];
    var admNo    = row[0];
    var name     = row[1];
    var gender   = row[2];
    var guardian = row[3];
    var phone    = row[4];
    var altPhone = row[5];
    var grade    = row[6];
    var term     = row[7];
    var status   = row[8];

    if (!admNo || !name || String(name).trim() === "") continue;
    if (String(status).trim().toUpperCase() !== "ACTIVE") continue;

    students.push({
      admNo       : admNo,
      name        : cleanStudentName(name),
      rawName     : name,
      gender      : gender,
      guardian    : guardian,
      phone       : phone,
      altPhone    : altPhone,
      grade       : grade,
      displayGrade: parseGrade(grade, name),
      term        : term,
      status      : status
    });
  }

  return { success: true, students: students };
}

// ============================================================
// 2. GET BALANCES
// ============================================================
function getBalances() {
  var sheet    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BALANCES);
  var data     = sheet.getDataRange().getValues();
  var balances = {};

  for (var i = 1; i < data.length; i++) {
    var row   = data[i];
    var admNo = row[0];
    if (!admNo) continue;

    balances[admNo] = {
      admNo        : admNo,
      name         : row[1],
      grade        : row[2],
      type         : row[3] || "0",
      balance      : Number(row[4]) || 0,
      totalToppedUp: Number(row[5]) || 0,
      totalSpent   : Number(row[6]) || 0,
      lastPayment  : row[7],
      lastMeal     : row[8]
    };
  }

  return { success: true, balances: balances };
}

// ============================================================
// 3. GET TRANSACTIONS
// ============================================================
function getTransactions(admNo) {
  var sheet        = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var data         = sheet.getDataRange().getValues();
  var transactions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var rowAdm = String(row[2]).trim();
    if (admNo && String(admNo).trim() !== rowAdm) continue;
    transactions.push({
      date       : formatDate(row[0]),
      type       : row[1],
      admNo      : row[2],
      name       : row[3],
      grade      : row[4],
      studentType: row[5],
      food       : row[6],
      tea        : row[7],
      porridge   : row[8],
      amount     : Number(row[9]) || 0,
      ref        : row[10],
      recordedBy : row[11],
      recordedAt : row[12]
    });
  }

  transactions.reverse();
  return { success: true, transactions: transactions };
}

// ============================================================
// 4. GET DASHBOARD
// ============================================================
function getDashboard() {
  var today    = formatDate(new Date());
  var students = getStudents().students;
  var balances = getBalances().balances;
  var txSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var txData   = txSheet.getDataRange().getValues();

  var todayMeals     = [];
  var todayCollected = 0;
  var todayDeducted  = 0;

  for (var i = 1; i < txData.length; i++) {
    var row = txData[i];
    if (!row[0] || formatDate(row[0]) !== today) continue;
    var amount = Number(row[9]) || 0;
    if (row[1] === "PAYMENT") {
      todayCollected += amount;
    } else if (row[1] === "MEAL") {
      todayDeducted += amount;
      todayMeals.push({
        name    : row[3],
        food    : row[6],
        tea     : row[7],
        porridge: row[8],
        amount  : amount
      });
    }
  }

  var netBalance     = 0;
  var inDebtCount    = 0;
  var inDebtTotal    = 0;
  var balanceByClass = {};

  for (var admNo in balances) {
    var b = balances[admNo];
    netBalance += b.balance;
    if (b.balance < 0) {
      inDebtCount++;
      inDebtTotal += Math.abs(b.balance);
    }
    var cls = b.grade;
    if (!balanceByClass[cls]) balanceByClass[cls] = { students: 0, balance: 0 };
    balanceByClass[cls].students++;
    balanceByClass[cls].balance += b.balance;
  }

  return {
    success       : true,
    date          : today,
    activeStudents: students.length,
    netBalance    : netBalance,
    todayCollected: todayCollected,
    todayDeducted : todayDeducted,
    inDebtCount   : inDebtCount,
    inDebtTotal   : inDebtTotal,
    todayMeals    : todayMeals,
    balanceByClass: balanceByClass
  };
}

// ============================================================
// 5. RECORD PAYMENT
// ============================================================
function recordPayment(params) {
  var admNo      = params.admNo;
  var name       = params.name;
  var grade      = params.grade;
  var amount     = Number(params.amount);
  var ref        = params.ref || "";
  var recordedBy = params.recordedBy || "Admin";
  var date       = params.date || formatDate(new Date());

  if (!admNo || !amount || amount <= 0) return { error: "Invalid payment data" };

  var txSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  txSheet.appendRow([date, "PAYMENT", admNo, name, grade, "", "", "", "", amount, ref, recordedBy, new Date()]);

  var newBalance = updateBalance(admNo, name, grade, amount, "PAYMENT", date);
  var newType    = autoAssignType(admNo);

  return {
    success   : true,
    admNo     : admNo,
    newBalance: newBalance,
    type      : newType,
    message   : "Payment of KES " + amount + " recorded for " + name
  };
}

// ============================================================
// 6. RECORD MEAL
// ============================================================
function recordMeal(params) {
  var admNo      = params.admNo;
  var name       = params.name;
  var grade      = params.grade;
  var food       = params.food     ? 1 : 0;
  var tea        = params.tea      ? 1 : 0;
  var porridge   = params.porridge ? 1 : 0;
  var date       = params.date || formatDate(new Date());
  var recordedBy = params.recordedBy || "Admin";
  var amount     = (food * PRICE_FOOD) + (tea * PRICE_TEA) + (porridge * PRICE_PORRIDGE);

  if (!admNo || amount === 0) return { error: "No items selected or invalid student" };

  var txSheet     = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var currentType = getStudentType(admNo);

  txSheet.appendRow([
    date, "MEAL", admNo, name, grade, currentType,
    food ? "YES" : "", tea ? "YES" : "", porridge ? "YES" : "",
    amount, "", recordedBy, new Date()
  ]);

  var newBalance = updateBalance(admNo, name, grade, -amount, "MEAL", date);
  var newType    = autoAssignType(admNo);

  return {
    success   : true,
    admNo     : admNo,
    deduction : amount,
    newBalance: newBalance,
    type      : newType,
    message   : "Meal of KES " + amount + " deducted for " + name
  };
}

// ============================================================
// 7. RECORD BULK MEALS
// ============================================================
function recordBulkMeals(params) {
  var meals   = params.meals;
  var results = [];
  for (var i = 0; i < meals.length; i++) results.push(recordMeal(meals[i]));
  return { success: true, results: results, count: results.length };
}

// ============================================================
// 8. GET WATCHLIST
// ============================================================
function getWatchlist() {
  var balances         = getBalances().balances;
  var txSheet          = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var txData           = txSheet.getDataRange().getValues();
  var highDebt         = [];
  var missedPayB       = [];
  var today            = new Date();
  var lastPaymentDates = {};

  for (var i = 1; i < txData.length; i++) {
    var row = txData[i];
    if (!row[0] || row[1] !== "PAYMENT") continue;
    var adm = String(row[2]).trim();
    var dt  = new Date(row[0]);
    if (!lastPaymentDates[adm] || dt > lastPaymentDates[adm]) lastPaymentDates[adm] = dt;
  }

  for (var admNo in balances) {
    var b = balances[admNo];

    if (b.balance <= -500) {
      highDebt.push({
        admNo    : admNo,
        name     : b.name,
        grade    : b.grade,
        type     : b.type,
        balance  : b.balance,
        dailyCost: calculateDailyCost(admNo)
      });
    }

    if (b.type === "B" && lastPaymentDates[admNo]) {
      var daysSince = Math.floor((today - lastPaymentDates[admNo]) / (1000 * 60 * 60 * 24));
      if (daysSince >= 14) {
        missedPayB.push({
          admNo      : admNo,
          name       : b.name,
          grade      : b.grade,
          lastPayment: formatDate(lastPaymentDates[admNo]),
          daysSince  : daysSince,
          balance    : b.balance
        });
      }
    }
  }

  highDebt.sort(function(a, b)   { return a.balance - b.balance; });
  missedPayB.sort(function(a, b) { return b.daysSince - a.daysSince; });

  return {
    success         : true,
    highDebt        : highDebt,
    missedPayB      : missedPayB,
    totalOutstanding: highDebt.reduce(function(sum, s) { return sum + Math.abs(s.balance); }, 0),
    watchlistCount  : highDebt.length + missedPayB.length
  };
}

// ============================================================
// 9. GET REPORTS
// ============================================================
function getReports(params) {
  var reportType   = params.reportType || "daily";
  var date         = params.date || formatDate(new Date());
  var txSheet      = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var txData       = txSheet.getDataRange().getValues();
  var balances     = getBalances().balances;
  var transactions = [];

  for (var i = 1; i < txData.length; i++) {
    var row = txData[i];
    if (!row[0]) continue;
    transactions.push({
      date       : formatDate(row[0]),
      type       : row[1],
      admNo      : row[2],
      name       : row[3],
      grade      : row[4],
      studentType: row[5],
      food       : row[6],
      tea        : row[7],
      porridge   : row[8],
      amount     : Number(row[9]) || 0
    });
  }

  var result = {};

  if (reportType === "daily") {
    var dayTx = transactions.filter(function(t) { return t.date === date; });
    result = {
      mealsServed     : dayTx.filter(function(t) { return t.type === "MEAL"; }).length,
      totalDeducted   : dayTx.filter(function(t) { return t.type === "MEAL"; }).reduce(function(s, t) { return s + t.amount; }, 0),
      paymentsReceived: dayTx.filter(function(t) { return t.type === "PAYMENT"; }).reduce(function(s, t) { return s + t.amount; }, 0),
      transactions    : dayTx
    };
  } else if (reportType === "allBalances") {
    result = { balances: Object.values(balances).sort(function(a, b) { return a.balance - b.balance; }) };
  } else if (reportType === "byType") {
    var byType = { A: [], B: [], C: [], D: [], "0": [] };
    for (var admNo in balances) {
      var t = balances[admNo].type || "0";
      if (!byType[t]) byType[t] = [];
      byType[t].push(balances[admNo]);
    }
    result = { byType: byType };
  } else if (reportType === "weekly") {
    result = { transactions: getWeekTransactions(transactions, date) };
  } else if (reportType === "monthly") {
    var month   = date.substring(0, 7);
    var monthTx = transactions.filter(function(t) { return t.date.startsWith(month); });
    result = {
      month         : month,
      totalDeducted : monthTx.filter(function(t) { return t.type === "MEAL"; }).reduce(function(s, t) { return s + t.amount; }, 0),
      totalCollected: monthTx.filter(function(t) { return t.type === "PAYMENT"; }).reduce(function(s, t) { return s + t.amount; }, 0),
      transactions  : monthTx
    };
  }

  return { success: true, reportType: reportType, data: result };
}

// ============================================================
// HELPER: UPDATE BALANCE ROW
// ============================================================
function updateBalance(admNo, name, grade, amount, txType, date) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BALANCES);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(admNo).trim()) {
      var newBalance    = (Number(data[i][4]) || 0) + amount;
      var totalToppedUp = Number(data[i][5]) || 0;
      var totalSpent    = Number(data[i][6]) || 0;
      var lastPayment   = data[i][7];
      var lastMeal      = data[i][8];

      if (txType === "PAYMENT") { totalToppedUp += amount;          lastPayment = date; }
      if (txType === "MEAL")    { totalSpent    += Math.abs(amount); lastMeal    = date; }

      sheet.getRange(i + 1, 5).setValue(newBalance);
      sheet.getRange(i + 1, 6).setValue(totalToppedUp);
      sheet.getRange(i + 1, 7).setValue(totalSpent);
      sheet.getRange(i + 1, 8).setValue(lastPayment);
      sheet.getRange(i + 1, 9).setValue(lastMeal);
      return newBalance;
    }
  }

  // Not found — create new row
  var initTopUp    = txType === "PAYMENT" ? amount : 0;
  var initSpent    = txType === "MEAL"    ? Math.abs(amount) : 0;
  var initLastPay  = txType === "PAYMENT" ? date : "";
  var initLastMeal = txType === "MEAL"    ? date : "";
  sheet.appendRow([admNo, name, grade, "0", amount, initTopUp, initSpent, initLastPay, initLastMeal]);
  return amount;
}

// ============================================================
// HELPER: AUTO-ASSIGN TYPE
// ============================================================
function autoAssignType(admNo) {
  var txSheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var data     = txSheet.getDataRange().getValues();
  var today    = new Date();
  var payments = [];
  var hasMeals = false;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[2]).trim() !== String(admNo).trim()) continue;
    if (row[1] === "PAYMENT") payments.push(new Date(row[0]));
    if (row[1] === "MEAL")    hasMeals = true;
  }

  var type = "0";
  if (payments.length === 0 && hasMeals) {
    type = "D";
  } else if (payments.length > 0) {
    var lastPay   = Math.max.apply(null, payments);
    var daysSince = Math.floor((today - lastPay) / (1000 * 60 * 60 * 24));
    var balance   = getStudentBalance(admNo);
    if (balance > 0)         type = "A";
    else if (daysSince <= 7) type = "B";
    else                     type = "C";
  }

  updateTypeInBalances(admNo, type);
  return type;
}

// ============================================================
// HELPER: UPDATE TYPE IN BALANCES
// ============================================================
function updateTypeInBalances(admNo, type) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BALANCES);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(admNo).trim()) {
      sheet.getRange(i + 1, 4).setValue(type);
      return;
    }
  }
}

// ============================================================
// HELPER: GET STUDENT TYPE
// ============================================================
function getStudentType(admNo) {
  var b = getBalances().balances;
  return b[admNo] ? b[admNo].type : "0";
}

// ============================================================
// HELPER: GET STUDENT BALANCE
// ============================================================
function getStudentBalance(admNo) {
  var b = getBalances().balances;
  return b[admNo] ? b[admNo].balance : 0;
}

// ============================================================
// HELPER: CALCULATE DAILY COST
// ============================================================
function calculateDailyCost(admNo) {
  var txSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var data    = txSheet.getDataRange().getValues();
  var meals   = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === String(admNo).trim() && data[i][1] === "MEAL") {
      meals.push(Number(data[i][9]) || 0);
    }
  }
  if (meals.length === 0) return 0;
  var last5 = meals.slice(-5);
  return Math.round(last5.reduce(function(a, b) { return a + b; }, 0) / last5.length);
}

// ============================================================
// HELPER: PARSE GRADE
// ============================================================
function parseGrade(grade, name) {
  if (String(grade).trim() !== "0") return "Grade " + grade;
  var n = String(name).trim().toUpperCase();
  if (n.startsWith("PP2")) return "PP2";
  if (n.startsWith("PP1")) return "PP1";
  if (n.startsWith("PG:")) return "PG";
  if (n.startsWith("PG ")) return "PG";
  return "ECD";
}

// ============================================================
// HELPER: CLEAN STUDENT NAME
// Removes prefix e.g. "PP2 BLUE: KEZIAH" → "KEZIAH"
// ============================================================
function cleanStudentName(name) {
  var n = String(name).trim();
  n = n.replace(/^(PP2\s+\w+\s*:\s*|PP1\s*:\s*|PG\s*:\s*)/i, "");
  return n.trim();
}

// ============================================================
// HELPER: FORMAT DATE → YYYY-MM-DD
// ============================================================
function formatDate(date) {
  if (!date) return "";
  var d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  var yyyy = d.getFullYear();
  var mm   = String(d.getMonth() + 1).padStart(2, "0");
  var dd   = String(d.getDate()).padStart(2, "0");
  return yyyy + "-" + mm + "-" + dd;
}

// ============================================================
// HELPER: GET WEEK TRANSACTIONS (Mon–Fri)
// ============================================================
function getWeekTransactions(transactions, dateStr) {
  var d   = new Date(dateStr);
  var day = d.getDay();
  var mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  var fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  var monStr = formatDate(mon);
  var friStr = formatDate(fri);
  return transactions.filter(function(t) { return t.date >= monStr && t.date <= friStr; });
}

// ============================================================
// CHECK TODAY MEALS
// Returns what a student has already eaten today
// ============================================================
function checkTodayMeals(params) {
  var admNo  = params.admNo;
  var date   = params.date || formatDate(new Date());
  var sheet  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  var data   = sheet.getDataRange().getValues();

  var todayItems = { food: false, tea: false, porridge: false, count: 0 };

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    if (String(row[2]).trim() !== String(admNo).trim()) continue;
    if (row[1] !== "MEAL") continue;
    if (formatDate(row[0]) !== date) continue;

    // Found a meal record for this student today
    if (row[6] === "YES") todayItems.food     = true;
    if (row[7] === "YES") todayItems.tea      = true;
    if (row[8] === "YES") todayItems.porridge = true;
    todayItems.count++;
  }

  return { success: true, admNo: admNo, date: date, todayItems: todayItems };
}
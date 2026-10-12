document.addEventListener("DOMContentLoaded", () => {
    // Sidebar Navigation Logic
    const navButtons = document.querySelectorAll(".calc-nav-btn");
    const panels = document.querySelectorAll(".calc-panel");

    navButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            navButtons.forEach((b) => b.classList.remove("active"));
            panels.forEach((p) => p.classList.add("hidden"));

            btn.classList.add("active");
            const targetId = btn.dataset.target;
            document.getElementById(targetId).classList.remove("hidden");
        });
    });

    // 1. Accounting: Margin & Markup Calculator
    const calcMarginBtn = document.getElementById("calc-margin-btn");
    calcMarginBtn.addEventListener("click", () => {
        const cost = parseFloat(document.getElementById("acc-cost").value);
        const price = parseFloat(document.getElementById("acc-price").value);
        const resultBox = document.getElementById("acc-margin-result");

        if (isNaN(cost) || isNaN(price) || cost <= 0) {
            alert("Please enter valid positive numbers for cost and price.");
            return;
        }

        const profit = price - cost;
        const margin = (profit / price) * 100;
        const markup = (profit / cost) * 100;

        document.getElementById("res-profit").textContent = `RM ${profit.toFixed(2)}`;
        document.getElementById("res-margin").textContent = `${margin.toFixed(2)}%`;
        document.getElementById("res-markup").textContent = `${markup.toFixed(2)}%`;
        resultBox.classList.remove("hidden");
    });

    // 1b. Accounting: Break-Even Calculator
    const calcBreakevenBtn = document.getElementById("calc-breakeven-btn");
    calcBreakevenBtn.addEventListener("click", () => {
        const fixed = parseFloat(document.getElementById("acc-fixed").value);
        const variable = parseFloat(document.getElementById("acc-var").value);
        const unitPrice = parseFloat(document.getElementById("acc-unit-price").value);
        const resultBox = document.getElementById("acc-breakeven-result");

        if (isNaN(fixed) || isNaN(variable) || isNaN(unitPrice) || unitPrice <= variable) {
            alert("Please ensure selling price is greater than variable cost.");
            return;
        }

        const contributionMargin = unitPrice - variable;
        const breakEvenUnits = Math.ceil(fixed / contributionMargin);
        const breakEvenRevenue = breakEvenUnits * unitPrice;

        document.getElementById("res-units").textContent = `${breakEvenUnits.toLocaleString()} units`;
        document.getElementById("res-revenue").textContent =
            `RM ${breakEvenRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        resultBox.classList.remove("hidden");
    });

    // 2. Coding: Number Base Converter
    const calcBaseBtn = document.getElementById("calc-base-btn");
    calcBaseBtn.addEventListener("click", () => {
        const valStr = document.getElementById("code-base-input").value.trim();
        const baseType = parseInt(document.getElementById("code-base-type").value);
        const resultBox = document.getElementById("code-base-result");

        if (!valStr) {
            alert("Please enter a value to convert.");
            return;
        }

        const decimalVal = parseInt(valStr, baseType);
        if (isNaN(decimalVal)) {
            alert("Invalid number format for the selected base.");
            return;
        }

        document.getElementById("res-dec").textContent = decimalVal.toString(10);
        document.getElementById("res-hex").textContent = "0x" + decimalVal.toString(16).toUpperCase();
        document.getElementById("res-bin").textContent = "0b" + decimalVal.toString(2);
        document.getElementById("res-oct").textContent = "0o" + decimalVal.toString(8);
        resultBox.classList.remove("hidden");
    });

    // 2b. Coding: PX to REM Converter
    const calcRemBtn = document.getElementById("calc-rem-btn");
    calcRemBtn.addEventListener("click", () => {
        const px = parseFloat(document.getElementById("code-px").value);
        const root = parseFloat(document.getElementById("code-root").value);
        const resultBox = document.getElementById("code-rem-result");

        if (isNaN(px) || isNaN(root) || root <= 0) {
            alert("Please enter valid pixel values.");
            return;
        }

        const rem = px / root;
        document.getElementById("res-rem").textContent = `${rem.toFixed(4)}rem (${px}px)`;
        resultBox.classList.remove("hidden");
    });

    // 3. Financial: Compound Interest Calculator
    const calcCompoundBtn = document.getElementById("calc-compound-btn");
    calcCompoundBtn.addEventListener("click", () => {
        const principal = parseFloat(document.getElementById("fin-principal").value);
        const rate = parseFloat(document.getElementById("fin-rate").value);
        const years = parseFloat(document.getElementById("fin-years").value);
        const resultBox = document.getElementById("fin-compound-result");

        if (isNaN(principal) || isNaN(rate) || isNaN(years)) {
            alert("Please fill in all financial fields correctly.");
            return;
        }

        const futureValue = principal * Math.pow(1 + rate / 100, years);
        const interestEarned = futureValue - principal;

        document.getElementById("res-future").textContent =
            `RM ${futureValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById("res-interest").textContent =
            `RM ${interestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        resultBox.classList.remove("hidden");
    });

    // 3b. Financial: Loan EMI Calculator
    const calcLoanBtn = document.getElementById("calc-loan-btn");
    calcLoanBtn.addEventListener("click", () => {
        const loanAmount = parseFloat(document.getElementById("loan-amount").value);
        const annualRate = parseFloat(document.getElementById("loan-rate").value);
        const years = parseFloat(document.getElementById("loan-years").value);
        const resultBox = document.getElementById("loan-result");

        if (isNaN(loanAmount) || isNaN(annualRate) || isNaN(years) || years <= 0) {
            alert("Please enter valid loan details.");
            return;
        }

        const monthlyRate = annualRate / 12 / 100;
        const totalMonths = years * 12;

        let emi = 0;
        if (monthlyRate === 0) {
            emi = loanAmount / totalMonths;
        } else {
            emi =
                (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }

        const totalPayment = emi * totalMonths;

        document.getElementById("res-emi").textContent =
            `RM ${emi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById("res-total-loan").textContent =
            `RM ${totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        resultBox.classList.remove("hidden");
    });
});

// Journal & Financial Entries State
let journalEntries = [];

const jeDescInput = document.getElementById("je-desc");
const jeTypeInput = document.getElementById("je-type");
const jeDebitInput = document.getElementById("je-debit");
const jeCreditInput = document.getElementById("je-credit");
const addJeBtn = document.getElementById("add-je-btn");
const jeTableBody = document.getElementById("je-table-body");
const jeEmptyRow = document.getElementById("je-empty-row");
const totalDebitEl = document.getElementById("total-debit");
const totalCreditEl = document.getElementById("total-credit");
const balanceStatus = document.getElementById("balance-status");
const exportStatementPdfBtn = document.getElementById("export-statement-pdf-btn");

addJeBtn.addEventListener("click", () => {
    const desc = jeDescInput.value.trim();
    const type = jeTypeInput.value;
    const debit = parseFloat(jeDebitInput.value) || 0;
    const credit = parseFloat(jeCreditInput.value) || 0;

    if (!desc) {
        alert("Please enter an account description.");
        return;
    }
    if (debit <= 0 && credit <= 0) {
        alert("Please enter either a debit or credit amount.");
        return;
    }

    journalEntries.push({ description: desc, type: type, debit: debit, credit: credit });

    jeDescInput.value = "";
    jeDebitInput.value = "";
    jeCreditInput.value = "";
    jeDescInput.focus();

    renderJournalTable();
});

function renderJournalTable() {
    jeTableBody.innerHTML = "";

    if (journalEntries.length === 0) {
        jeTableBody.appendChild(jeEmptyRow);
        totalDebitEl.textContent = "RM 0.00";
        totalCreditEl.textContent = "RM 0.00";
        balanceStatus.className =
            "font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20";
        balanceStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Trial Balance Unbalanced`;
        exportStatementPdfBtn.disabled = true;
        return;
    }

    let sumDebit = 0;
    let sumCredit = 0;

    journalEntries.forEach((entry, index) => {
        sumDebit += entry.debit;
        sumCredit += entry.credit;

        const badgeColor =
            entry.type === "Revenue"
                ? "bg-emerald-500/10 text-emerald-600"
                : entry.type === "Expense"
                  ? "bg-rose-500/10 text-rose-600"
                  : entry.type === "Asset"
                    ? "bg-blue-500/10 text-blue-600"
                    : entry.type === "Liability"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-purple-500/10 text-purple-600";

        const tr = document.createElement("tr");
        tr.className =
            "border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30";
        tr.innerHTML = `
                <td class="p-2.5 font-medium">${escapeHtml(entry.description)}</td>
                <td class="p-2.5"><span class="text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor}">${entry.type}</span></td>
                <td class="p-2.5 text-right font-mono">${entry.debit > 0 ? entry.debit.toFixed(2) : "-"}</td>
                <td class="p-2.5 text-right font-mono">${entry.credit > 0 ? entry.credit.toFixed(2) : "-"}</td>
                <td class="p-2.5 text-center">
                    <button class="text-red-500 hover:text-red-700 text-xs px-1.5 py-1 rounded" onclick="window.removeJournalEntry(${index})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
        jeTableBody.appendChild(tr);
    });

    totalDebitEl.textContent = `RM ${sumDebit.toFixed(2)}`;
    totalCreditEl.textContent = `RM ${sumCredit.toFixed(2)}`;

    const isBalanced = Math.abs(sumDebit - sumCredit) < 0.01;
    if (isBalanced) {
        balanceStatus.className =
            "font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
        balanceStatus.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Trial Balance Balanced`;
        exportStatementPdfBtn.disabled = false;
    } else {
        balanceStatus.className =
            "font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20";
        balanceStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> Trial Balance Unbalanced (Diff: RM ${Math.abs(sumDebit - sumCredit).toFixed(2)})`;
        exportStatementPdfBtn.disabled = true;
    }
}

window.removeJournalEntry = function (index) {
    journalEntries.splice(index, 1);
    renderJournalTable();
};

function escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

// Export Full Financial Statements (Income Statement + Balance Sheet + Trial Balance)
exportStatementPdfBtn.addEventListener("click", () => {
    if (journalEntries.length === 0) return;

    let totalDr = 0;
    let totalCr = 0;
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    let trialRows = "";
    let incomeRows = "";
    let bsRows = "";

    journalEntries.forEach((entry) => {
        totalDr += entry.debit;
        totalCr += entry.credit;

        // Calculate Net balances (Debit increases Asset/Expense, Credit increases Rev/Liab/Equity)
        let netBalance =
            entry.type === "Asset" || entry.type === "Expense"
                ? entry.debit - entry.credit
                : entry.credit - entry.debit;

        trialRows += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #cbd5e1;">${escapeHtml(entry.description)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${entry.debit > 0 ? entry.debit.toFixed(2) : "-"}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${entry.credit > 0 ? entry.credit.toFixed(2) : "-"}</td>
                </tr>
            `;

        if (entry.type === "Revenue") {
            totalRevenue += netBalance;
            incomeRows += `<tr><td style="padding: 6px; border-bottom: 1px dashed #e2e8f0;">${escapeHtml(entry.description)}</td><td style="padding: 6px; border-bottom: 1px dashed #e2e8f0; text-align: right; font-family: monospace;">RM ${netBalance.toFixed(2)}</td></tr>`;
        } else if (entry.type === "Expense") {
            totalExpense += netBalance;
            incomeRows += `<tr><td style="padding: 6px; border-bottom: 1px dashed #e2e8f0;">Less: ${escapeHtml(entry.description)}</td><td style="padding: 6px; border-bottom: 1px dashed #e2e8f0; text-align: right; font-family: monospace;">(RM ${netBalance.toFixed(2)})</td></tr>`;
        } else if (entry.type === "Asset") {
            totalAssets += netBalance;
            bsRows += `<tr><td style="padding: 6px; border-bottom: 1px dashed #e2e8f0;">${escapeHtml(entry.description)}</td><td style="padding: 6px; border-bottom: 1px dashed #e2e8f0; text-align: right; font-family: monospace;">RM ${netBalance.toFixed(2)}</td></tr>`;
        } else if (entry.type === "Liability") {
            totalLiabilities += netBalance;
        } else if (entry.type === "Equity") {
            totalEquity += netBalance;
        }
    });

    const netProfit = totalRevenue - totalExpense;
    const endingEquity = totalEquity + netProfit;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Complete Financial Statements</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.4; }
                    h2 { color: #0d9488; margin-bottom: 2px; text-transform: uppercase; }
                    h3 { color: #0f172a; border-bottom: 2px solid #0d9488; padding-bottom: 5px; margin-top: 30px; font-size: 16px; }
                    p.sub { color: #64748b; font-size: 11px; margin-bottom: 25px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 13px; }
                    th { background-color: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 12px; }
                    .total-row { font-weight: bold; border-top: 2px solid #0f172a; padding: 8px 0; }
                </style>
            </head>
            <body>
                <h2>COMPANY FINANCIAL STATEMENTS</h2>
                <p class="sub">Generated via DaTools DaCalc Pro &bull; ${new Date().toLocaleDateString()}</p>

                <h3>1. Statement of Profit or Loss (Income Statement)</h3>
                <table>
                    ${incomeRows || '<tr><td colspan="2">No revenue or expense entries recorded.</td></tr>'}
                    <tr class="total-row">
                        <td style="padding: 8px;">Net Profit / (Loss)</td>
                        <td style="padding: 8px; text-align: right; color: ${netProfit >= 0 ? "#0d9488" : "#e11d48"};">RM ${netProfit.toFixed(2)}</td>
                    </tr>
                </table>

                <h3>2. Statement of Financial Position (Balance Sheet)</h3>
                <p style="font-weight: bold; margin-bottom: 4px;">Assets</p>
                <table>
                    ${bsRows || '<tr><td colspan="2">No asset accounts recorded.</td></tr>'}
                    <tr class="total-row">
                        <td style="padding: 8px;">Total Assets</td>
                        <td style="padding: 8px; text-align: right;">RM ${totalAssets.toFixed(2)}</td>
                    </tr>
                </table>

                <p style="font-weight: bold; margin-bottom: 4px; margin-top: 15px;">Liabilities & Equity</p>
                <table>
                    <tr><td style="padding: 6px;">Total Liabilities</td><td style="padding: 6px; text-align: right; font-family: monospace;">RM ${totalLiabilities.toFixed(2)}</td></tr>
                    <tr><td style="padding: 6px;">Owner's Equity & Retained Earnings</td><td style="padding: 6px; text-align: right; font-family: monospace;">RM ${endingEquity.toFixed(2)}</td></tr>
                    <tr class="total-row">
                        <td style="padding: 8px;">Total Liabilities & Equity</td>
                        <td style="padding: 8px; text-align: right;">RM ${(totalLiabilities + endingEquity).toFixed(2)}</td>
                    </tr>
                </table>

                <h3>3. Trial Balance Verification</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Account Description</th>
                            <th style="text-align: right;">Debit (RM)</th>
                            <th style="text-align: right;">Credit (RM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trialRows}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; border-top: 2px solid #0f172a;">
                            <td style="padding: 10px;">Trial Balance Total</td>
                            <td style="padding: 10px; text-align: right; color: #0d9488;">RM ${totalDr.toFixed(2)}</td>
                            <td style="padding: 10px; text-align: right; color: #0d9488;">RM ${totalCr.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
    printWindow.document.close();
});

// Add inside document.addEventListener("DOMContentLoaded", () => { ... }) in calc.js

// Loan Amortization State
let amortizationSchedule = [];
let amortSummary = {};

const amortPrincipalInput = document.getElementById("amort-principal");
const amortRateInput = document.getElementById("amort-rate");
const amortYearsInput = document.getElementById("amort-years");
const calcAmortBtn = document.getElementById("calc-amort-btn");

const amortSummaryBox = document.getElementById("amort-summary-box");
const resAmortEmi = document.getElementById("res-amort-emi");
const resAmortInterest = document.getElementById("res-amort-interest");
const resAmortTotal = document.getElementById("res-amort-total");

const amortTableBox = document.getElementById("amort-table-box");
const amortTableBody = document.getElementById("amort-table-body");
const amortActions = document.getElementById("amort-actions");
const exportAmortPdfBtn = document.getElementById("export-amort-pdf-btn");

calcAmortBtn.addEventListener("click", () => {
    const principal = parseFloat(amortPrincipalInput.value);
    const annualRate = parseFloat(amortRateInput.value);
    const years = parseFloat(amortYearsInput.value);

    if (isNaN(principal) || isNaN(annualRate) || isNaN(years) || principal <= 0 || years <= 0) {
        alert("Please enter valid positive numbers for Principal, Interest Rate, and Tenure.");
        return;
    }

    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = years * 12;

    let emi = 0;
    if (monthlyRate === 0) {
        emi = principal / totalMonths;
    } else {
        emi =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    let balance = principal;
    let totalInterestPaid = 0;
    amortizationSchedule = [];

    for (let month = 1; month <= totalMonths; month++) {
        const interestPayment = balance * monthlyRate;
        let principalPayment = emi - interestPayment;

        if (balance < principalPayment) {
            principalPayment = balance;
        }

        balance -= principalPayment;
        if (balance < 0) balance = 0;
        totalInterestPaid += interestPayment;

        amortizationSchedule.push({
            month: month,
            payment: emi,
            principalPaid: principalPayment,
            interestPaid: interestPayment,
            remainingBalance: balance
        });
    }

    const totalPayable = principal + totalInterestPaid;
    amortSummary = {
        principal: principal,
        annualRate: annualRate,
        years: years,
        emi: emi,
        totalInterest: totalInterestPaid,
        totalPayable: totalPayable
    };

    // Render Summary UI
    resAmortEmi.textContent = `RM ${emi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    resAmortInterest.textContent = `RM ${totalInterestPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    resAmortTotal.textContent = `RM ${totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Render Table
    amortTableBody.innerHTML = "";
    amortizationSchedule.forEach((row) => {
        const tr = document.createElement("tr");
        tr.className =
            "border-b border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/30";
        tr.innerHTML = `
                <td class="p-2.5 text-center font-medium">${row.month}</td>
                <td class="p-2.5 text-right font-mono">RM ${row.payment.toFixed(2)}</td>
                <td class="p-2.5 text-right font-mono text-emerald-600">RM ${row.principalPaid.toFixed(2)}</td>
                <td class="p-2.5 text-right font-mono text-amber-600">RM ${row.interestPaid.toFixed(2)}</td>
                <td class="p-2.5 text-right font-mono">RM ${row.remainingBalance.toFixed(2)}</td>
            `;
        amortTableBody.appendChild(tr);
    });

    amortSummaryBox.classList.remove("hidden");
    amortTableBox.classList.remove("hidden");
    amortActions.classList.remove("hidden");
});

// Export Amortization Schedule to PDF via Browser Print
exportAmortPdfBtn.addEventListener("click", () => {
    if (amortizationSchedule.length === 0) return;

    let rowsHtml = amortizationSchedule
        .map(
            (row) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: center;">${row.month}</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace;">RM ${row.payment.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: #059669;">RM ${row.principalPaid.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace; color: #d97706;">RM ${row.interestPaid.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #cbd5e1; text-align: right; font-family: monospace;">RM ${row.remainingBalance.toFixed(2)}</td>
            </tr>
        `
        )
        .join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Loan Amortization Schedule</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; line-height: 1.4; }
                    h2 { color: #0d9488; margin-bottom: 4px; text-transform: uppercase; }
                    p.sub { color: #64748b; font-size: 11px; margin-bottom: 20px; }
                    .summary-grid { display: flex; gap: 15px; margin-bottom: 25px; }
                    .summary-box { flex: 1; padding: 12px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; }
                    .summary-box p.title { font-size: 11px; color: #64748b; margin: 0 0 4px 0; }
                    .summary-box p.val { font-size: 15px; font-weight: bold; margin: 0; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th { background-color: #f1f5f9; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                </style>
            </head>
            <body>
                <h2>LOAN AMORTIZATION SCHEDULE</h2>
                <p class="sub">Generated via DaTools DaCalc Pro &bull; ${new Date().toLocaleDateString()}</p>

                <div class="summary-grid">
                    <div class="summary-box">
                        <p class="title">Loan Principal</p>
                        <p class="val">RM ${amortSummary.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div class="summary-box">
                        <p class="title">Interest Rate / Tenure</p>
                        <p class="val">${amortSummary.annualRate}% / ${amortSummary.years} Yrs</p>
                    </div>
                    <div class="summary-box">
                        <p class="title">Monthly EMI</p>
                        <p class="val" style="color: #0d9488;">RM ${amortSummary.emi.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div class="summary-box">
                        <p class="title">Total Interest</p>
                        <p class="val" style="color: #d97706;">RM ${amortSummary.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center;">Month</th>
                            <th style="text-align: right;">Payment</th>
                            <th style="text-align: right;">Principal Paid</th>
                            <th style="text-align: right;">Interest Paid</th>
                            <th style="text-align: right;">Remaining Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
    printWindow.document.close();
});

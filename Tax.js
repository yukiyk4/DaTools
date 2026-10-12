// DOM Elements
const amountInput = document.getElementById('amountInput');
const qtyInput = document.getElementById('qtyInput');
const discountInput = document.getElementById('discountInput');
const serviceInput = document.getElementById('serviceInput');
const taxInput = document.getElementById('taxInput');
const shippingInput = document.getElementById('shippingInput');
const taxInclusiveToggle = document.getElementById('taxInclusiveToggle');
const splitInput = document.getElementById('splitInput');

const baseSubtotalDisplay = document.getElementById('baseSubtotalDisplay');
const discountDisplay = document.getElementById('discountDisplay');
const serviceDisplay = document.getElementById('serviceDisplay');
const taxAmountDisplay = document.getElementById('taxAmountDisplay');
const shippingDisplay = document.getElementById('shippingDisplay');
const grandTotalDisplay = document.getElementById('grandTotalDisplay');
const splitRow = document.getElementById('splitRow');
const splitCountDisplay = document.getElementById('splitCountDisplay');
const perPersonDisplay = document.getElementById('perPersonDisplay');
const resetBtn = document.getElementById('resetBtn');

// Calculate Function
function calculateTax() {
    const unitPrice = parseFloat(amountInput.value) || 0;
    const qty = parseInt(qtyInput.value) || 1;
    const discountPercent = parseFloat(discountInput.value) || 0;
    const servicePercent = parseFloat(serviceInput.value) || 0;
    const taxPercent = parseFloat(taxInput.value) || 0;
    const shippingFee = parseFloat(shippingInput.value) || 0;
    const isInclusive = taxInclusiveToggle.checked;
    const splitCount = parseInt(splitInput.value) || 1;

    // 1. Base Subtotal
    const baseSubtotal = unitPrice * qty;

    // 2. Discount
    const discountAmount = baseSubtotal * (discountPercent / 100);
    const subtotalAfterDiscount = baseSubtotal - discountAmount;

    // 3. Service Charge
    const serviceAmount = subtotalAfterDiscount * (servicePercent / 100);

    // 4. Tax Calculation
    let taxAmount = 0;
    const taxableBase = subtotalAfterDiscount + serviceAmount;

    if (isInclusive) {
        // Reverse tax extraction if tax is already inside the amount
        const netAmount = taxableBase / (1 + (taxPercent / 100));
        taxAmount = taxableBase - netAmount;
    } else {
        // Standard additive tax
        taxAmount = taxableBase * (taxPercent / 100);
    }

    // 5. Grand Total
    // If inclusive, tax is already part of taxableBase, so don't add tax again.
    const grandTotal = isInclusive
        ? taxableBase + shippingFee
        : taxableBase + taxAmount + shippingFee;

    // 6. Split Bill Calculation
    const validSplit = splitCount > 0 ? splitCount : 1;
    const perPersonTotal = grandTotal / validSplit;

    // Update UI Displays
    baseSubtotalDisplay.textContent = `$${baseSubtotal.toFixed(2)}`;
    discountDisplay.textContent = `-$${discountAmount.toFixed(2)}`;
    serviceDisplay.textContent = `+$${serviceAmount.toFixed(2)}`;
    taxAmountDisplay.textContent = `${isInclusive ? '(Inclusive) ' : '+'}$${taxAmount.toFixed(2)}`;
    shippingDisplay.textContent = `+$${shippingFee.toFixed(2)}`;
    grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;

    // Handle Split Bill Row Visibility
    if (validSplit > 1) {
        splitRow.classList.remove('hidden');
        splitCountDisplay.textContent = validSplit;
        perPersonDisplay.textContent = `$${perPersonTotal.toFixed(2)}`;
    } else {
        splitRow.classList.add('hidden');
    }
}

// Event Listeners for Live Calculation
[amountInput, qtyInput, discountInput, serviceInput, taxInput, shippingInput, taxInclusiveToggle, splitInput].forEach(element => {
    element.addEventListener('input', calculateTax);
    element.addEventListener('change', calculateTax);
});

// Reset Handler
resetBtn.addEventListener('click', () => {
    amountInput.value = '';
    qtyInput.value = '1';
    discountInput.value = '0';
    serviceInput.value = '0';
    taxInput.value = '6';
    shippingInput.value = '0';
    taxInclusiveToggle.checked = false;
    splitInput.value = '1';
    calculateTax();
});

// --- Dark Mode Synchronization ---
const toggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeText) themeText.textContent = 'Light Mode';
    themeIcon.textContent = '☀️';
}

toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    themeIcon.textContent = isDark ? '☀️' : '🌙';
    if (themeText) themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Run initial calculation
calculateTax();

  // ---------- DOM elements ----------
  const previousOperandElem = document.getElementById('previousOperand');
  const currentOperandElem = document.getElementById('currentOperand');

  // ---------- Calculator state ----------
  let currentOperand = '0';     // the number currently being typed / result shown
  let previousOperand = '';     // stored number before operator
  let operation = null;          // current operator (+, -, *, /, %)
  let shouldResetScreen = false; // flag to reset screen after equals or operator selection

  // Helper: update the display (UI refresh)
  function updateDisplay() {
    // format current operand: remove unnecessary trailing decimal if .0 etc but keep as string
    let displayCurrent = currentOperand;
    if (displayCurrent === '') displayCurrent = '0';
    // avoid showing -0 edgecase
    if (displayCurrent === '-0') displayCurrent = '0';
    currentOperandElem.innerText = displayCurrent;

    // format previous operand with operator if exists
    if (operation !== null && previousOperand !== '') {
      let opSymbol = '';
      switch (operation) {
        case '+': opSymbol = '+'; break;
        case '-': opSymbol = '−'; break;
        case '*': opSymbol = '×'; break;
        case '/': opSymbol = '÷'; break;
        case '%': opSymbol = '%'; break;
        default: opSymbol = operation;
      }
      previousOperandElem.innerText = `${previousOperand} ${opSymbol}`;
    } else {
      previousOperandElem.innerText = previousOperand === '' ? '0' : previousOperand;
    }
    // if no operation and previousOperand empty, show 0 or something elegant
    if (previousOperand === '' && operation === null) {
      previousOperandElem.innerText = '0';
    }
  }

  // utility: clean number string (prevent multiple leading zeros)
  function sanitizeNumberString(str) {
    if (str === '') return '';
    // remove leading zeros unless it's a single zero or decimal starts
    if (str.includes('.')) {
      let parts = str.split('.');
      if (parts[0].length > 1) {
        parts[0] = parts[0].replace(/^0+/, '');
        if (parts[0] === '') parts[0] = '0';
      } else if (parts[0] === '00') parts[0] = '0';
      return parts[0] + (parts[1] !== undefined ? '.' + parts[1] : '');
    } else {
      // integer: remove leading zeros
      if (str.length > 1) {
        return str.replace(/^0+/, '') || '0';
      }
      return str;
    }
  }

  // append digit or decimal point
  function appendNumber(number) {
    if (shouldResetScreen) {
      currentOperand = '';
      shouldResetScreen = false;
    }
    // prevent multiple decimals
    if (number === '.' && currentOperand.includes('.')) return;
    // limit length to avoid overflow (12 characters reasonable)
    if (currentOperand.replace(/\./g, '').length >= 14 && number !== '.') return;

    if (currentOperand === '0' && number !== '.') {
      currentOperand = number;
    } else {
      currentOperand += number;
    }
    // sanitize after appending (avoid "00" cases)
    currentOperand = sanitizeNumberString(currentOperand);
    updateDisplay();
  }

  // delete last character
  function deleteLast() {
    if (shouldResetScreen) {
      // if reset flag active, just reset to 0
      currentOperand = '0';
      shouldResetScreen = false;
      updateDisplay();
      return;
    }
    if (currentOperand.length === 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
      currentOperand = '0';
    } else {
      currentOperand = currentOperand.slice(0, -1);
      if (currentOperand === '' || currentOperand === '-') currentOperand = '0';
    }
    currentOperand = sanitizeNumberString(currentOperand);
    updateDisplay();
  }

  // clear everything (AC)
  function clearAll() {
    currentOperand = '0';
    previousOperand = '';
    operation = null;
    shouldResetScreen = false;
    updateDisplay();
  }

  // perform computation based on current operation
  function computeResult() {
    if (operation === null || previousOperand === '' || shouldResetScreen) return null;
    const prev = parseFloat(previousOperand);
    const curr = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(curr)) return null;

    let result;
    switch (operation) {
      case '+':
        result = prev + curr;
        break;
      case '-':
        result = prev - curr;
        break;
      case '*':
        result = prev * curr;
        break;
      case '/':
        if (curr === 0) {
          return 'error'; // division by zero
        }
        result = prev / curr;
        break;
      case '%':
        result = prev % curr;
        break;
      default:
        return null;
    }
    // rounding to avoid floating point ugliness: max 10 decimal digits if needed
    if (typeof result === 'number') {
      // handle tiny rounding errors
      result = parseFloat(result.toFixed(10));
      // convert to string removing trailing .0 if whole
      if (Number.isInteger(result)) {
        return result.toString();
      } else {
        // trim trailing zeros
        return result.toString();
      }
    }
    return result.toString();
  }

  // choose operator (+, -, *, /, %)
  function chooseOperator(op) {
    // if there's a pending operation and we are not resetting, compute previous first
    if (operation !== null && previousOperand !== '' && !shouldResetScreen) {
      // if currentOperand is valid, evaluate intermediate result
      const tempResult = computeResult();
      if (tempResult === 'error') {
        clearAll();
        currentOperand = 'Math Error';
        updateDisplay();
        operation = null;
        previousOperand = '';
        shouldResetScreen = true;
        return;
      }
      if (tempResult !== null && tempResult !== 'error') {
        currentOperand = tempResult;
        previousOperand = '';
        operation = null;
        updateDisplay();
      }
    }
    // now set new operation
    if (currentOperand === '' || currentOperand === '0' && op === '%') {
      // edge: if no current operand but operator pressed, allow if prev exists? but safe
      if (previousOperand !== '' && (currentOperand === '0' || currentOperand === '')) {
        // do nothing but assign
      }
    }
    // assign previous operand from current
    previousOperand = currentOperand;
    operation = op;
    shouldResetScreen = true;   // next number entry will replace current display
    updateDisplay();
  }

  // equals: final evaluation
  function evaluate() {
    if (operation === null || previousOperand === '' || shouldResetScreen) {
      // if no operation pending, just refresh but do nothing
      if (currentOperand === '') currentOperand = '0';
      updateDisplay();
      return;
    }
    const result = computeResult();
    if (result === 'error') {
      clearAll();
      currentOperand = 'Division by zero';
      updateDisplay();
      operation = null;
      previousOperand = '';
      shouldResetScreen = true;
      return;
    }
    if (result !== null) {
      // update current with result
      currentOperand = result;
      previousOperand = '';
      operation = null;
      shouldResetScreen = true;  // after equals, next number starts fresh
      updateDisplay();
    } else {
      // fallback: do nothing
      updateDisplay();
    }
  }

  // Additional handlers for percentage edge & negative values ?
  // but we already support % as binary operator.
  // However, to make behavior intuitive: if user presses % as unary? but we use standard binary.
  // Also let's handle the case: if no previous operand, just treat as modulo with 0? but typical calculators: a% = percent of previous. We'll keep binary as per standard.
  // extra: if the user clicks operator after equals, we store result as previous and continue, which is already handled in chooseOperator.

  // ----- Bonus: keyboard support (accessibility & faster interaction) -----
  function handleKeyboard(e) {
    const key = e.key;
    // numbers and decimal
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      appendNumber(key);
    } else if (key === '.') {
      e.preventDefault();
      appendNumber('.');
    } else if (key === 'Backspace') {
      e.preventDefault();
      deleteLast();
    } else if (key === 'Delete' || key === 'Escape') {
      e.preventDefault();
      clearAll();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      e.preventDefault();
      let opMap = key;
      if (key === '*') opMap = '*';
      if (key === '/') opMap = '/';
      chooseOperator(opMap);
    } else if (key === '%') {
      e.preventDefault();
      chooseOperator('%');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      evaluate();
    }
  }

  // ----- Event listeners for UI buttons (using event delegation via dataset) -----
  const buttonsGrid = document.querySelector('.buttons-grid');
  buttonsGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    // number buttons
    if (btn.classList.contains('number') && btn.dataset.number !== undefined) {
      appendNumber(btn.dataset.number);
    }
    // dot (special number but .)
    else if (btn.dataset.action === 'dot') {
      appendNumber('.');
    }
    // clear
    else if (btn.dataset.action === 'clear') {
      clearAll();
    }
    // delete
    else if (btn.dataset.action === 'delete') {
      deleteLast();
    }
    // operators (+, -, *, /, %)
    else if (btn.dataset.operator) {
      let op = btn.dataset.operator;
      if (op === '÷') op = '/';
      if (op === '×') op = '*';
      if (op === '−') op = '-';
      chooseOperator(op);
    }
    // equals
    else if (btn.dataset.action === 'equals') {
      evaluate();
    }
    // fallback for any other button: maybe percentage operator if included
    else if (btn.classList.contains('operator') && btn.innerText === '%') {
      chooseOperator('%');
    }
  });

  // initialize display
  updateDisplay();

  // Attach global keyboard listener
  window.addEventListener('keydown', handleKeyboard);

  // optional: prevent accidental form submits if any
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();  // prevent focus stealing but keep click event
    });
  });
  // small fix to allow button clicks to retain but not causing flicker
  // ensures no double event side effects
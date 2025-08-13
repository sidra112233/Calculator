import React, { useState } from "react";

const padButtons = [
  { id: "clear", label: "AC", key: "Escape", span: "col-span-2", kind: "util" },
  { id: "divide", label: "/", key: "/", kind: "op" },
  { id: "multiply", label: "*", key: "*", kind: "op" },
  { id: "seven", label: "7", key: "7", kind: "num" },
  { id: "eight", label: "8", key: "8", kind: "num" },
  { id: "nine", label: "9", key: "9", kind: "num" },
  { id: "subtract", label: "-", key: "-", kind: "op" },
  { id: "four", label: "4", key: "4", kind: "num" },
  { id: "five", label: "5", key: "5", kind: "num" },
  { id: "six", label: "6", key: "6", kind: "num" },
  { id: "add", label: "+", key: "+", kind: "op" },
  { id: "one", label: "1", key: "1", kind: "num" },
  { id: "two", label: "2", key: "2", kind: "num" },
  { id: "three", label: "3", key: "3", kind: "num" },
  { id: "equals", label: "=", key: "Enter", span: "row-span-2", kind: "equals" },
  { id: "zero", label: "0", key: "0", span: "col-span-2", kind: "num" },
  { id: "decimal", label: ".", key: ".", kind: "dot" },
];

function classFor(kind) {
  switch (kind) {
    case "op":
      return "bg-berkeley-blue text-mint-cream hover:brightness-110";
    case "util":
      return "bg-oxford-blue text-powder-blue hover:brightness-110";
    case "equals":
      return "bg-yale-blue text-white hover:brightness-110";
    default:
      return "bg-slate-800 text-white hover:brightness-110";
  }
}

const AppShell = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#0b2545] to-[#13315c] p-4">
    <style>{`
      :root{
        --yale-blue:#134074; --berkeley-blue:#13315c; --oxford-blue:#0b2545; --powder-blue:#8da9c4; --mint-cream:#eef4ed;
      }
      .bg-yale-blue{ background: var(--yale-blue); }
      .bg-berkeley-blue{ background: var(--berkeley-blue); }
      .bg-oxford-blue{ background: var(--oxford-blue); }
      .text-powder-blue{ color: var(--powder-blue); }
      .text-mint-cream{ color: var(--mint-cream); }
    `}</style>
    {children}
  </div>
);

function sanitizeTrailingOperators(expr) {
  let out = expr;
  while (/([+\-*/])\-?$/.test(out)) {
    out = out.replace(/([+\-*/])\-?$/, "");
  }
  return out;
}

function safeEval(expr) {
  const clean = sanitizeTrailingOperators(expr).replace(/\u00D7/g, "*").replace(/\u00F7/g, "/");
  if (clean.trim() === "") return 0;
  let result = 0;
  try {
    result = Function(`"use strict"; return (${clean})`)();
  } catch (e) {
    return NaN;
  }
  if (!isFinite(result)) return result;
  const rounded = Math.round(result * 1e12) / 1e12;
  let s = String(rounded);
  if (s.includes("e")) s = rounded.toFixed(12);
  s = s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  return s;
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [formula, setFormula] = useState("");
  const [evaluated, setEvaluated] = useState(false);
  const [lastType, setLastType] = useState("init");
  const [current, setCurrent] = useState("0");

  const clearAll = () => {
    setDisplay("0");
    setFormula("");
    setEvaluated(false);
    setLastType("init");
    setCurrent("0");
  };

  const handleNumber = (n) => {
    if (evaluated) {
      setDisplay(n);
      setFormula(n);
      setEvaluated(false);
      setLastType("num");
      setCurrent(n);
      return;
    }
    if (current === "0" && n === "0" && (lastType === "num" || lastType === "dot" || lastType === "init")) return;

    let newCurrent = current;
    if (lastType === "op" || lastType === "init") {
      newCurrent = n;
      setFormula((prev) => (prev === "" ? n : prev + n));
    } else if (current === "0") {
      newCurrent = n;
      setFormula((prev) => prev.replace(/(?<=^|[+\-*/])0$/, n));
    } else {
      newCurrent = current + n;
      setFormula((prev) => prev + n);
    }
    setDisplay(newCurrent);
    setCurrent(newCurrent);
    setLastType("num");
  };

  const handleDot = () => {
    if (evaluated) {
      setDisplay("0.");
      setFormula("0.");
      setEvaluated(false);
      setCurrent("0.");
      setLastType("dot");
      return;
    }
    if (lastType === "op" || lastType === "init") {
      setFormula((prev) => (prev === "" ? "0." : prev + "0."));
      setDisplay("0.");
      setCurrent("0.");
      setLastType("dot");
      return;
    }
    if (current.includes(".")) return;

    setFormula((prev) => prev + ".");
    setDisplay(current + ".");
    setCurrent((c) => c + ".");
    setLastType("dot");
  };

  const handleOperator = (op) => {
    if (evaluated) {
      setFormula(String(display) + op);
      setDisplay(op);
      setEvaluated(false);
      setLastType("op");
      setCurrent("0");
      return;
    }
    setCurrent("0");
    setLastType("op");

    setFormula((prev) => {
      if (prev === "" && op === "-") {
        setDisplay("-");
        return "-";
      }
      if (/[+\-*/]$/.test(prev)) {
        if (op === "-" && !/\-$/.test(prev)) {
          setDisplay("-");
          return prev + "-";
        }
        const replaced = prev.replace(/([+\-*/])\-?$/, op);
        setDisplay(op);
        return replaced;
      }
      setDisplay(op);
      return prev + op;
    });
  };

  const handleEquals = () => {
    const expr = sanitizeTrailingOperators(formula);
    const result = safeEval(expr);
    setDisplay(String(result));
    setFormula(expr + "=" + String(result));
    setEvaluated(true);
    setLastType("equals");
    setCurrent(String(result));
  };

  const onKeyDown = (e) => {
    const { key } = e;
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      handleNumber(key);
    } else if (["+", "-", "*", "/"].includes(key)) {
      e.preventDefault();
      handleOperator(key);
    } else if (key === ".") {
      e.preventDefault();
      handleDot();
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      handleEquals();
    } else if (key === "Escape" || key.toLowerCase() === "c") {
      e.preventDefault();
      clearAll();
    }
  };

  return (
    <AppShell>
      <div
        className="w-[350px] grid gap-3" // fixed width
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="Calculator"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-black/40 backdrop-blur-md border border-white/10">
          <div className="px-4 pt-4 text-right text-powder-blue text-sm select-none min-h-[1.5rem] break-words">
            {formula || "\u00A0"}
          </div>
          <div id="display" className="px-4 pb-4 text-right text-4xl md:text-5xl font-semibold text-mint-cream">
            {display}
          </div>
          <div className="grid grid-cols-4 grid-rows-5 gap-2 p-3 bg-black/30">
            {padButtons.map((b) => (
              <button
                key={b.id}
                id={b.id}
                onClick={() => {
                  if (b.kind === "num") handleNumber(b.label);
                  else if (b.kind === "dot") handleDot();
                  else if (b.kind === "op") handleOperator(b.label);
                  else if (b.kind === "equals") handleEquals();
                  else if (b.id === "clear") clearAll();
                }}
                className={`rounded-2xl shadow-lg px-4 py-4 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-white/60 active:scale-[0.98] transition ${classFor(
                  b.kind
                )} ${b.span ?? ""}`}
                aria-label={b.id}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-powder-blue/90 mt-2 select-none">
          <span className="opacity-80">React • Formula logic • Precision rounding • Keyboard support</span>
        </p>
      </div>
    </AppShell>
  );
}

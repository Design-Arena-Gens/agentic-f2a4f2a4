"use client";

import { useEffect, useMemo, useState } from "react";

function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function arabicDateLabel(dateStr) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("ar", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

const PRIORITIES = [
  { value: "low", label: "?????" },
  { value: "medium", label: "?????" },
  { value: "high", label: "????" },
];

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [tasksByDate, setTasksByDate] = useState({});
  const [filter, setFilter] = useState("all"); // all | open | done
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  const storageKey = "dailyTasks.v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTasksByDate(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasksByDate));
    } catch {}
  }, [tasksByDate]);

  const tasks = useMemo(() => tasksByDate[selectedDate] || [], [tasksByDate, selectedDate]);

  function upsertTasksForDate(dateStr, nextTasks) {
    setTasksByDate((prev) => ({ ...prev, [dateStr]: nextTasks }));
  }

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    const next = [
      {
        id: crypto.randomUUID(),
        title,
        priority: newTaskPriority,
        done: false,
        createdAt: Date.now(),
      },
      ...tasks,
    ];
    upsertTasksForDate(selectedDate, next);
    setNewTaskTitle("");
    setNewTaskPriority("medium");
  }

  function toggleTask(id) {
    const next = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    upsertTasksForDate(selectedDate, next);
  }

  function removeTask(id) {
    const next = tasks.filter((t) => t.id !== id);
    upsertTasksForDate(selectedDate, next);
  }

  function updateTaskTitle(id, title) {
    const next = tasks.map((t) => (t.id === id ? { ...t, title } : t));
    upsertTasksForDate(selectedDate, next);
  }

  function updateTaskPriority(id, priority) {
    const next = tasks.map((t) => (t.id === id ? { ...t, priority } : t));
    upsertTasksForDate(selectedDate, next);
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === "open") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const open = total - done;
    return { total, done, open };
  }, [tasks]);

  return (
    <main className="container">
      <header className="header">
        <h1>???? ??????? ???????</h1>
        <div className="headerRow">
          <label className="label">
            ???????
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
          <div className="stats" aria-live="polite">
            <span>???????: {stats.total}</span>
            <span>??? ????: {stats.open}</span>
            <span>????: {stats.done}</span>
          </div>
        </div>
        <div className="dateLabel">{arabicDateLabel(selectedDate)}</div>
      </header>

      <section className="controls">
        <div className="addRow">
          <input
            className="input"
            placeholder="???? ???? ?????"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
          />
          <select
            className="select"
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={addTask}>
            ?????
          </button>
        </div>

        <div className="filters">
          <button
            className={`btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            ????
          </button>
          <button
            className={`btn ${filter === "open" ? "active" : ""}`}
            onClick={() => setFilter("open")}
          >
            ??? ???????
          </button>
          <button
            className={`btn ${filter === "done" ? "active" : ""}`}
            onClick={() => setFilter("done")}
          >
            ???????
          </button>
        </div>
      </section>

      <section className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>????</th>
              <th>??????</th>
              <th style={{ width: 160 }}>????????</th>
              <th style={{ width: 120 }}>???????</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">
                  ?? ???? ???? ???? ?????
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className={task.done ? "rowDone" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      aria-label={task.done ? "??? ??? ????" : "??? ????"}
                    />
                  </td>
                  <td>
                    <input
                      className="cellInput"
                      value={task.title}
                      onChange={(e) => updateTaskTitle(task.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="select"
                      value={task.priority}
                      onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn danger" onClick={() => removeTask(task.id)}>
                      ???
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="footer">
        <span>
          ???????? ?????? ?????? ??? ??? ??????? ???.
        </span>
      </footer>
    </main>
  );
}

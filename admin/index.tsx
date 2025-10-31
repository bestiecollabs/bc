import React, { useEffect, useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  username: string | null;
  is_admin: number;
  role: "brand" | "creator" | null;
  created_at: string;
  suspended_at?: string | null;
  deleted_at?: string | null;
};

function accountType(u: AdminUser) {
  return u.is_admin ? "admin" : (u.role ?? "");
}

export default function AdminPage() {
  const [rowsActive, setRowsActive] = useState<AdminUser[]>([]);
  const [rowsSuspended, setRowsSuspended] = useState<AdminUser[]>([]);
  const [rowsDeleted, setRowsDeleted] = useState<AdminUser[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load(state: "active" | "suspended" | "deleted") {
    const r = await fetch(`/api/admin/users?state=${state}&limit=100`, {
      headers: { "CF-Access-Jwt-Assertion": (window as any).jwt || "" },
    });
    const j = await r.json();
    if (state === "active") setRowsActive(j.items || []);
    if (state === "suspended") setRowsSuspended(j.items || []);
    if (state === "deleted") setRowsDeleted(j.items || []);
  }

  useEffect(() => {
    load("active");
    load("suspended");
    load("deleted");
  }, []);

  async function post(body: any) {
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CF-Access-Jwt-Assertion": (window as any).jwt || "",
      },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.error) {
      setError(j?.error || "error");
      return false;
    }
    setError(null);
    await Promise.all([load("active"), load("suspended"), load("deleted")]);
    return true;
  }

  async function onCreate() {
    if (!newEmail) return;
    await post({ action: "create", email: newEmail });
    setNewEmail("");
  }
  async function onSetUsername(id: string) {
    const username = window.prompt("New username (3-20 letters/numbers/_)") || "";
    if (!username) return;
    await post({ action: "set_username", id, username });
  }
  async function onSuspend(id: string) { await post({ action: "suspend", id }); }
  async function onUnsuspend(id: string) { await post({ action: "unsuspend", id }); }
  async function onDelete(id: string) { await post({ action: "delete", id }); }
  async function onUndelete(id: string) { await post({ action: "undelete", id }); }

  const ErrText: Record<string,string> = {
    last_admin_blocked: "You are the only admin. This action is blocked.",
    username_taken: "That username is taken.",
    invalid_username: "Invalid username. Use letters, numbers, underscore.",
    rate_limited: "Too many requests. Try again later.",
  };

  function Table({ title, rows, actions }: { title: string; rows: AdminUser[]; actions: (u: AdminUser) => JSX.Element; }) {
    return (
      <section>
        <h2>{title}</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Email</th><th>Username</th><th>Account type</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.username ?? ""}</td>
                <td>{accountType(u)}</td>
                <td>{u.created_at}</td>
                <td>{actions(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <main className="admin">
      <h1>Users</h1>

      <div style={{ textAlign: "right", marginBottom: 12 }}>
        <input
          placeholder="newuser@example.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button onClick={onCreate}>Create</button>
      </div>

      {error ? <div className="banner error">{ErrText[error] ?? "Action failed."}</div> : null}

      <Table
        title="Active"
        rows={rowsActive}
        actions={(u) => (
          <>
            <button onClick={() => onSetUsername(u.id)}>Set username</button>{" "}
            <button onClick={() => onSuspend(u.id)}>Suspend</button>{" "}
            <button onClick={() => onDelete(u.id)}>Delete</button>
          </>
        )}
      />

      <Table
        title="Suspended"
        rows={rowsSuspended}
        actions={(u) => (
          <>
            <button onClick={() => onUnsuspend(u.id)}>Unsuspend</button>{" "}
            <button onClick={() => onDelete(u.id)}>Delete</button>
          </>
        )}
      />

      <Table
        title="Deleted"
        rows={rowsDeleted}
        actions={(u) => (
          <>
            <button onClick={() => onUndelete(u.id)}>Undelete</button>
          </>
        )}
      />
    </main>
  );
}

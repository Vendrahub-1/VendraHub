'use client';

import { useState } from 'react';

export default function CustomerHomeNotifications() {
  const [open, setOpen] = useState(false);
  return (
    <div className="vh-home-notifications">
      <button type="button" className="vh-home-notification-trigger" aria-label="View notifications" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span aria-hidden="true">♧</span><span>Notifications</span>
      </button>
      {open && <section className="vh-home-notification-panel" role="status" aria-live="polite">
        <strong>Notifications</strong>
        <p>You’re all caught up. New order and account updates will appear here.</p>
        <button type="button" onClick={() => setOpen(false)}>Close</button>
      </section>}
    </div>
  );
}

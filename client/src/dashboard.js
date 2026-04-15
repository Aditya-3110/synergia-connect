import React, { useEffect, useState } from "react";
import axios from "axios";
import Chatbot from "./chatbot";
import PrivateChat from "./chat";
import Toast from "./Toast";
import { API_URL, getAuthConfig } from "./api";

const ACCENT_BY_SUBJECT = {
  design: "#f97316",
  development: "#2563eb",
  programming: "#2563eb",
  marketing: "#db2777",
  science: "#16a34a",
  default: "#7c3aed",
};

function Dashboard({ userName, userId }) {
  const [page, setPage] = useState("home");
  const { isTablet, isMobile } = useResponsiveLayout();

  // EVENTS
  const [events, setEvents] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  // RESOURCES
  const [resources, setResources] = useState([]);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [resTitle, setResTitle] = useState("");
  const [resLink, setResLink] = useState("");
  const [resSubject, setResSubject] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    fetchEvents();
    fetchResources();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/events`);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch events", error);
      setEvents([]);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API_URL}/resources`);
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch resources", error);
      setResources([]);
    }
  };

  const handleAddEvent = async () => {
    if (!title.trim() || !description.trim() || !date) {
      showToast("Please fill in title, description, and date.", "error");
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        date,
      };
      const response = editingEventId
        ? await axios.put(`${API_URL}/events/${editingEventId}`, payload, getAuthConfig())
        : await axios.post(`${API_URL}/add-event`, payload, getAuthConfig());

      resetEventForm();
      await fetchEvents();
      showToast(response.data);
    } catch (error) {
      showToast(error.response?.data || "Unable to save event right now.", "error");
    }
  };

  const handleAddResource = async () => {
    if (!resTitle.trim() || !resLink.trim() || !resSubject.trim()) {
      showToast("Please fill in title, link, and subject.", "error");
      return;
    }

    try {
      const payload = {
        title: resTitle.trim(),
        link: resLink.trim(),
        subject: resSubject.trim(),
      };
      const response = editingResourceId
        ? await axios.put(`${API_URL}/resources/${editingResourceId}`, payload, getAuthConfig())
        : await axios.post(`${API_URL}/add-resource`, payload, getAuthConfig());

      resetResourceForm();
      await fetchResources();
      showToast(response.data);
    } catch (error) {
      showToast(error.response?.data || "Unable to save resource right now.", "error");
    }
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setTitle("");
    setDescription("");
    setDate("");
  };

  const resetResourceForm = () => {
    setEditingResourceId(null);
    setResTitle("");
    setResLink("");
    setResSubject("");
  };

  const startEventEdit = (event) => {
    setEditingEventId(event._id);
    setTitle(event.title || "");
    setDescription(event.description || "");
    setDate(formatDateForInput(event.date));
  };

  const startResourceEdit = (resource) => {
    setEditingResourceId(resource._id);
    setResTitle(resource.title || "");
    setResLink(resource.link || "");
    setResSubject(resource.subject || "");
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Delete this event?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/events/${eventId}`, getAuthConfig());

      if (editingEventId === eventId) {
        resetEventForm();
      }

      await fetchEvents();
      showToast(response.data);
    } catch (error) {
      showToast(error.response?.data || "Unable to delete event right now.", "error");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Delete this resource?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/resources/${resourceId}`, getAuthConfig());

      if (editingResourceId === resourceId) {
        resetResourceForm();
      }

      await fetchResources();
      showToast(response.data);
    } catch (error) {
      showToast(error.response?.data || "Unable to delete resource right now.", "error");
    }
  };

  const today = new Date();

  const sortedEvents = [...events].sort((firstEvent, secondEvent) => {
    const firstDate = new Date(firstEvent.date || 0).getTime();
    const secondDate = new Date(secondEvent.date || 0).getTime();

    return firstDate - secondDate;
  });

  const upcomingEvents = sortedEvents.filter((event) => {
    if (!event.date) {
      return false;
    }

    return new Date(event.date) >= new Date(today.toDateString());
  });

  const latestResources = [...resources].slice(-3).reverse();
  const nextEvent = upcomingEvents[0];
  const uniqueSubjects = new Set(
    resources
      .map((resource) => resource.subject?.trim())
      .filter(Boolean)
      .map((subject) => subject.toLowerCase())
  ).size;
  const thisMonthEvents = events.filter((event) => {
    if (!event.date) {
      return false;
    }

    const eventDate = new Date(event.date);

    return (
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  }).length;

  const metrics = [
    {
      label: "Upcoming events",
      value: upcomingEvents.length,
      detail: nextEvent
        ? `Next: ${formatDate(nextEvent.date)}`
        : "No event scheduled yet",
    },
    {
      label: "Resource library",
      value: resources.length,
      detail:
        uniqueSubjects > 0
          ? `${uniqueSubjects} subjects covered`
          : "Start sharing your study material",
    },
    {
      label: "This month",
      value: thisMonthEvents,
      detail: "Events happening this month",
    },
  ];

  const quickActions = [
    {
      title: "Plan an event",
      description: "Publish the next workshop, meetup, or club activity.",
      cta: "Open events",
      pageKey: "events",
      tone: "#2563eb",
    },
    {
      title: "Share a resource",
      description: "Upload notes, links, and useful references for students.",
      cta: "Open resources",
      pageKey: "resources",
      tone: "#f97316",
    },
  ];

  const navItems = [
    {
      key: "home",
      label: "Home",
      caption: "Overview",
      count: events.length + resources.length,
    },
    {
      key: "events",
      label: "Events",
      caption: "Live schedule",
      count: upcomingEvents.length,
    },
    {
      key: "resources",
      label: "Resources",
      caption: "Knowledge base",
      count: resources.length,
    },
    {
    key: "chat",
    label: "Messages",
    caption: "Private chat",
    count: 0,
  },
    {
    key: "ai",
    label: "AI",
    caption: "Assistant",
    count: 0,
  },
  ];
  const displayName = userName?.trim() || localStorage.getItem("userName") || "Student";

  return (
    <div style={shell}>
      <div
        style={{
          ...navbar,
          ...(isTablet ? navbarTablet : {}),
          ...(isMobile ? navbarMobile : {}),
        }}
      >
        <div style={{ ...brandCluster, ...(isMobile ? brandClusterMobile : {}) }}>
          <button onClick={() => setPage("home")} style={brandButton}>
            <span style={{ ...brandMark, ...(isMobile ? brandMarkMobile : {}) }}>S</span>
            <span>
              <span style={{ ...brandName, ...(isMobile ? brandNameMobile : {}) }}>
                <span style={brandNameLead}>Syner</span>
                <span style={brandNameAccent}>gia</span>
              </span>
              {!isMobile && (
                <span style={brandTagline}>Student activity command center</span>
              )}
            </span>
          </button>

          <div style={{ ...statusPill, ...(isMobile ? statusPillMobile : {}) }}>
            <span style={statusDot} />
            <span>
              {nextEvent ? `Next event ${formatDate(nextEvent.date)}` : `Hello, ${displayName}`}
            </span>
          </div>
        </div>

        <div style={{ ...navActions, ...(isTablet ? navActionsTablet : {}) }}>
          {navItems.map((item) => {
            const isActive = page === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                style={{
                  ...(isActive ? activeNavBtn : navBtn),
                  ...(isMobile ? navBtnMobile : {}),
                }}
              >
                <span style={navBtnTopRow}>
                  <span>{item.label}</span>
                  {!isMobile && (
                    <span style={isActive ? activeNavCount : navCount}>{item.count}</span>
                  )}
                </span>
                {!isMobile && <span style={navCaption}>{item.caption}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ ...navUtility, ...(isTablet ? navUtilityTablet : {}) }}>
          <div style={{ ...utilityCard, ...(isMobile ? utilityCardMobile : {}) }}>
            {!isMobile && <span style={utilityLabel}>Live now</span>}
            <span style={utilityValue}>{upcomingEvents.length} upcoming</span>
          </div>
          <div style={{ ...userBadge, ...(isMobile ? userBadgeMobile : {}) }}>
            <span style={userAvatar}>{getInitial(displayName)}</span>
            {!isMobile && (
              <span style={userBadgeText}>
                <span style={userBadgeLabel}>Logged in as</span>
                <strong>{displayName}</strong>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userName");
              localStorage.removeItem("userId");
              window.location.reload();
            }}
            style={{ ...logoutBtn, ...(isMobile ? logoutBtnMobile : {}) }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ ...mainArea, ...(isMobile ? mainAreaMobile : {}) }}>
        {page === "home" && (
          <div style={{ ...homeLayout, ...(isTablet ? homeLayoutTablet : {}) }}>
            <section style={{ ...heroSection, ...(isMobile ? heroSectionMobile : {}) }}>
              <div style={heroBadge}>Dynamic student dashboard</div>
              <p style={welcomeLine}>Hello, {displayName}</p>
              <h1 style={{ ...mainHeading, ...(isMobile ? mainHeadingMobile : {}) }}>
                Campus updates, resources, and momentum in one place.
              </h1>
              <p style={heroCopy}>
                Track what is happening next, keep popular resources visible, and jump
                straight into the actions that keep Synergia active.
              </p>

              <div style={heroButtons}>
                <button onClick={() => setPage("events")} style={heroPrimaryBtn}>
                  Create event
                </button>
                <button onClick={() => setPage("resources")} style={heroSecondaryBtn}>
                  Add resource
                </button>
              </div>

              <div style={{ ...statsGrid, ...(isMobile ? statsGridMobile : {}) }}>
                {metrics.map((metric) => (
                  <div key={metric.label} style={statCard}>
                    <p style={statLabel}>{metric.label}</p>
                    <h2 style={statValue}>{metric.value}</h2>
                    <p style={statDetail}>{metric.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={sidePanel}>
              <div style={spotlightCard}>
                <p style={panelEyebrow}>Next spotlight</p>
                <h3 style={panelTitle}>
                  {nextEvent ? nextEvent.title : "No upcoming event yet"}
                </h3>
                <p style={panelText}>
                  {nextEvent
                    ? `${formatDate(nextEvent.date)} • ${nextEvent.description || "Add a short description to highlight this event."}`
                    : "Your next published event will appear here with a quick summary."}
                </p>
              </div>

              <div style={miniTimeline}>
                <p style={panelEyebrow}>Quick actions</p>
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={() => setPage(action.pageKey)}
                    style={{ ...actionCard, borderLeft: `4px solid ${action.tone}` }}
                  >
                    <span style={actionTitle}>{action.title}</span>
                    <span style={actionDescription}>{action.description}</span>
                    <span style={actionLink}>{action.cta}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {page === "home" && (
          <div style={{ ...overviewGrid, ...(isMobile ? overviewGridMobile : {}) }}>
            <section style={panel}>
              <div style={sectionHeader}>
                <div>
                  <p style={panelEyebrow}>Upcoming events</p>
                  <h2 style={sectionTitle}>What students can join next</h2>
                </div>
                <button onClick={() => setPage("events")} style={linkBtn}>
                  Manage
                </button>
              </div>

              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 3).map((event, index) => (
                  <div key={`${event.title}-${index}`} style={listCard}>
                    <div>
                      <h3 style={listTitle}>{event.title}</h3>
                      <p style={listMeta}>{formatDate(event.date)}</p>
                    </div>
                    <p style={listBody}>
                      {event.description || "No description added yet."}
                    </p>
                  </div>
                ))
              ) : (
                <div style={emptyState}>
                  <h3 style={emptyTitle}>No upcoming events yet</h3>
                  <p style={emptyText}>
                    Add your first event to make the dashboard feel alive for students.
                  </p>
                </div>
              )}
            </section>

            <section style={panel}>
              <div style={sectionHeader}>
                <div>
                  <p style={panelEyebrow}>Fresh resources</p>
                  <h2 style={sectionTitle}>Recently shared study material</h2>
                </div>
                <button onClick={() => setPage("resources")} style={linkBtn}>
                  Browse
                </button>
              </div>

              {latestResources.length > 0 ? (
                latestResources.map((resource, index) => (
                  <div key={`${resource.title}-${index}`} style={resourceCard}>
                    <div
                      style={{
                        ...resourceAccent,
                        background:
                          ACCENT_BY_SUBJECT[
                            resource.subject?.trim()?.toLowerCase()
                          ] || ACCENT_BY_SUBJECT.default,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={resourceHeader}>
                        <h3 style={listTitle}>{resource.title}</h3>
                        <span style={resourceTag}>
                          {resource.subject || "General"}
                        </span>
                      </div>
                      <a href={resource.link} target="_blank" rel="noreferrer" style={resourceLink}>
                        Open resource
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyState}>
                  <h3 style={emptyTitle}>No resources yet</h3>
                  <p style={emptyText}>
                    Add notes, tools, or reading links so the library can start growing.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {page === "events" && (
          <div style={{ ...pageLayout, ...(isMobile ? pageLayoutMobile : {}) }}>
            <div style={pageHeader}>
              <p style={panelEyebrow}>Events hub</p>
              <h1 style={pageTitle}>Create and review campus events</h1>
              <p style={workingAsText}>Working as {displayName}</p>
            </div>

            <div style={formCard}>
              <div style={formHeader}>
                <div>
                  <h2 style={formTitle}>
                    {editingEventId ? "Edit event" : "Add event"}
                  </h2>
                  <p style={formSubtitle}>
                    {editingEventId
                      ? "Update the event details and save your changes."
                      : "Create a new event for your campus community."}
                  </p>
                </div>
                {editingEventId && (
                  <button onClick={resetEventForm} style={ghostBtn}>
                    Cancel edit
                  </button>
                )}
              </div>

              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={input}
              />
              <input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={input}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={input}
              />

              <button onClick={handleAddEvent} style={btn}>
                {editingEventId ? "Update Event" : "Add Event"}
              </button>
            </div>

            <div style={listGrid}>
              {sortedEvents.length > 0 ? (
                sortedEvents.map((event, index) => (
                  <div key={event._id || `${event.title}-${index}`} style={box}>
                    <h3 style={boxTitle}>{event.title}</h3>
                    <p style={boxMeta}>{formatDate(event.date)}</p>
                    <p style={boxDescription}>
                      {event.description || "No description added yet."}
                    </p>
                    <div style={boxActions}>
                      <button onClick={() => startEventEdit(event)} style={secondaryActionBtn}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteEvent(event._id)} style={dangerActionBtn}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyState}>
                  <h3 style={emptyTitle}>No events added yet</h3>
                  <p style={emptyText}>
                    Use the form above to publish the first event.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {page === "resources" && (
          <div style={{ ...pageLayout, ...(isMobile ? pageLayoutMobile : {}) }}>
            <div style={pageHeader}>
              <p style={panelEyebrow}>Resource center</p>
              <h1 style={pageTitle}>Share useful links and study materials</h1>
              <p style={workingAsText}>Working as {displayName}</p>
            </div>
            

            <div style={formCard}>
              <div style={formHeader}>
                <div>
                  <h2 style={formTitle}>
                    {editingResourceId ? "Edit resource" : "Add resource"}
                  </h2>
                  <p style={formSubtitle}>
                    {editingResourceId
                      ? "Refresh the link or subject details and save."
                      : "Share a useful link or study material for students."}
                  </p>
                </div>
                {editingResourceId && (
                  <button onClick={resetResourceForm} style={ghostBtn}>
                    Cancel edit
                  </button>
                )}
              </div>

              <input
                placeholder="Title"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                style={input}
              />
              <input
                placeholder="Link"
                value={resLink}
                onChange={(e) => setResLink(e.target.value)}
                style={input}
              />
              <input
                placeholder="Subject"
                value={resSubject}
                onChange={(e) => setResSubject(e.target.value)}
                style={input}
              />

              <button onClick={handleAddResource} style={btn}>
                {editingResourceId ? "Update Resource" : "Add Resource"}
              </button>
            </div>

            <div style={listGrid}>
              {resources.length > 0 ? (
                resources.map((resource, index) => (
                  <div key={resource._id || `${resource.title}-${index}`} style={box}>
                    <div style={resourceHeader}>
                      <h3 style={boxTitle}>{resource.title}</h3>
                      <span style={resourceTag}>{resource.subject || "General"}</span>
                    </div>
                    <a href={resource.link} target="_blank" rel="noreferrer" style={resourceLink}>
                      Open resource
                    </a>
                    <div style={boxActions}>
                      <button
                        onClick={() => startResourceEdit(resource)}
                        style={secondaryActionBtn}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource._id)}
                        style={dangerActionBtn}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyState}>
                  <h3 style={emptyTitle}>No resources shared yet</h3>
                  <p style={emptyText}>
                    Add the first useful link to kick off the resource library.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {page === "chat" && (
        <div style={{ ...chatPageLayout, ...(isMobile ? pageLayoutMobile : {}) }}>
            <div style={pageHeader}>
              <p style={panelEyebrow}>Private messages</p>
              <h1 style={pageTitle}>Chat with registered students</h1>
              <p style={workingAsText}>Working as {displayName}</p>
            </div>
            <PrivateChat
              currentUserId={userId}
              currentUserName={displayName}
              onNotify={showToast}
            />
          </div>
        )}
        {page === "ai" && (
        <div style={{ ...chatPageLayout, ...(isMobile ? pageLayoutMobile : {}) }}>
            <div style={pageHeader}>
              <p style={panelEyebrow}>AI assistant</p>
              <h1 style={pageTitle}>Smart chat for student support</h1>
              <p style={workingAsText}>Working as {displayName}</p>
            </div>
            <Chatbot onNotify={showToast} />
          </div>
        )}
      </div>
      <Toast toast={toast} />
    </div>
    
  );
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Date not set";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateForInput(dateValue) {
  if (!dateValue) {
    return "";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().split("T")[0];
}

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "S";
}

function useResponsiveLayout() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isTablet: width <= 1100,
    isMobile: width <= 700,
  };
}

const navbar = {
  background: "rgba(15, 23, 42, 0.92)",
  backdropFilter: "blur(14px)",
  color: "white",
  padding: "18px 32px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.4fr) auto",
  gap: "16px",
  alignItems: "center",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const navbarTablet = {
  gridTemplateColumns: "1fr",
  alignItems: "stretch",
};

const navbarMobile = {
  padding: "10px 12px",
  gap: "10px",
};

const brandCluster = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  alignItems: "flex-start",
};

const brandClusterMobile = {
  alignItems: "flex-start",
  gap: "6px",
};

const brandButton = {
  background: "transparent",
  border: "none",
  color: "white",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  textAlign: "left",
};

const brandMark = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #f97316, #2563eb)",
  fontWeight: 800,
  boxShadow: "0 10px 24px rgba(37,99,235,0.25)",
};

const brandMarkMobile = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
};

const brandName = {
  display: "flex",
  alignItems: "baseline",
  gap: "2px",
  fontSize: "1.3rem",
  fontWeight: 800,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  lineHeight: 1,
};

const brandNameMobile = {
  fontSize: "1.05rem",
};

const brandNameLead = {
  color: "#f8fafc",
  textShadow: "0 8px 24px rgba(37,99,235,0.22)",
};

const brandNameAccent = {
  background: "linear-gradient(135deg, #f97316, #fb7185)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "none",
};

const brandTagline = {
  display: "block",
  color: "#94a3b8",
  fontSize: "0.86rem",
  marginTop: "2px",
};

const statusPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  fontSize: "0.85rem",
  border: "1px solid rgba(255,255,255,0.1)",
};

const statusPillMobile = {
  padding: "6px 10px",
  fontSize: "0.78rem",
};

const statusDot = {
  width: "8px",
  height: "8px",
  borderRadius: "999px",
  background: "#22c55e",
  boxShadow: "0 0 0 4px rgba(34,197,94,0.16)",
};

const shell = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(37,99,235,0.16), transparent 32%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
};

const navActions = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "center",
};

const navActionsTablet = {
  justifyContent: "flex-start",
  overflowX: "auto",
  paddingBottom: "4px",
  flexWrap: "nowrap",
};

const navBtn = {
  background: "rgba(255,255,255,0.06)",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.1)",
  padding: "10px 14px",
  borderRadius: "18px",
  cursor: "pointer",
  minWidth: "150px",
  display: "grid",
  gap: "6px",
  textAlign: "left",
};

const navBtnMobile = {
  minWidth: "auto",
  padding: "8px 12px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  gap: "0",
  whiteSpace: "nowrap",
};

const activeNavBtn = {
  ...navBtn,
  background: "linear-gradient(135deg, rgba(249,115,22,0.24), rgba(37,99,235,0.28))",
  border: "1px solid rgba(255,255,255,0.24)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.22)",
};

const navBtnTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  fontWeight: 700,
};

const navCount = {
  minWidth: "28px",
  height: "28px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  fontSize: "0.82rem",
};

const activeNavCount = {
  ...navCount,
  background: "#fff7ed",
  color: "#9a3412",
};

const navCaption = {
  color: "#94a3b8",
  fontSize: "0.8rem",
};

const navUtility = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const navUtilityTablet = {
  justifyContent: "flex-start",
};

const utilityCardMobile = {
  padding: "8px 12px",
  borderRadius: "999px",
};

const utilityCard = {
  display: "grid",
  gap: "2px",
  padding: "10px 14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const utilityLabel = {
  color: "#94a3b8",
  fontSize: "0.76rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const utilityValue = {
  color: "#f8fafc",
  fontWeight: 700,
};

const userBadge = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const userBadgeMobile = {
  padding: "7px",
};

const userAvatar = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  color: "white",
  background: "linear-gradient(135deg, #f97316, #2563eb)",
  fontWeight: 900,
};

const userBadgeText = {
  display: "grid",
  gap: "2px",
  color: "#f8fafc",
  lineHeight: 1.1,
};

const userBadgeLabel = {
  color: "#94a3b8",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const logoutBtn = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "10px 14px",
  borderRadius: "999px",
  cursor: "pointer",
};

const logoutBtnMobile = {
  padding: "8px 12px",
};

const mainArea = {
  maxWidth: "1180px",
  margin: "0 auto",
  padding: "32px 20px 48px",
};

const mainAreaMobile = {
  padding: "20px 14px 36px",
};

const homeLayout = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
  gap: "24px",
  alignItems: "stretch",
  marginBottom: "24px",
};

const homeLayoutTablet = {
  gridTemplateColumns: "1fr",
};

const heroSection = {
  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #f97316 100%)",
  color: "white",
  borderRadius: "28px",
  padding: "32px",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
};

const heroSectionMobile = {
  padding: "24px",
  borderRadius: "24px",
};

const heroBadge = {
  display: "inline-flex",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  fontSize: "0.9rem",
  marginBottom: "18px",
};

const welcomeLine = {
  margin: "0 0 14px",
  color: "#bfdbfe",
  fontSize: "1rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const mainHeading = {
  fontSize: "clamp(2rem, 4vw, 3.6rem)",
  lineHeight: 1.05,
  margin: "0 0 14px",
  maxWidth: "10ch",
};

const mainHeadingMobile = {
  maxWidth: "100%",
};

const heroCopy = {
  color: "rgba(255,255,255,0.82)",
  maxWidth: "52ch",
  lineHeight: 1.6,
  marginBottom: "24px",
};

const heroButtons = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const heroPrimaryBtn = {
  background: "#fff7ed",
  color: "#9a3412",
  border: "none",
  padding: "12px 18px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 600,
};

const heroSecondaryBtn = {
  background: "transparent",
  color: "white",
  border: "1px solid rgba(255,255,255,0.4)",
  padding: "12px 18px",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 600,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const statsGridMobile = {
  gridTemplateColumns: "1fr",
};

const statCard = {
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "20px",
  padding: "18px",
  backdropFilter: "blur(12px)",
};

const statLabel = {
  margin: "0 0 10px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "0.9rem",
};

const statValue = {
  margin: "0 0 8px",
  fontSize: "2rem",
};

const statDetail = {
  margin: 0,
  color: "rgba(255,255,255,0.84)",
  lineHeight: 1.5,
};

const sidePanel = {
  display: "grid",
  gap: "18px",
};

const spotlightCard = {
  background: "#fff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(37, 99, 235, 0.12)",
};

const miniTimeline = {
  background: "rgba(255,255,255,0.76)",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const panelEyebrow = {
  margin: "0 0 8px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.78rem",
  color: "#64748b",
};

const panelTitle = {
  margin: "0 0 10px",
  fontSize: "1.35rem",
  color: "#0f172a",
};

const panelText = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
};

const actionCard = {
  width: "100%",
  textAlign: "left",
  background: "#ffffff",
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: "18px",
  padding: "16px",
  cursor: "pointer",
  display: "grid",
  gap: "6px",
  marginTop: "12px",
};

const actionTitle = {
  fontSize: "1rem",
  fontWeight: 700,
  color: "#0f172a",
};

const actionDescription = {
  color: "#475569",
  lineHeight: 1.5,
};

const actionLink = {
  color: "#2563eb",
  fontWeight: 600,
};

const overviewGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "24px",
};

const overviewGridMobile = {
  gridTemplateColumns: "1fr",
};

const panel = {
  background: "rgba(255,255,255,0.84)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  border: "1px solid rgba(148,163,184,0.16)",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const sectionTitle = {
  margin: 0,
  color: "#0f172a",
};

const linkBtn = {
  background: "transparent",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 600,
};

const listCard = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "18px",
  border: "1px solid rgba(148,163,184,0.14)",
  marginBottom: "14px",
};

const listTitle = {
  margin: "0 0 6px",
  color: "#0f172a",
};

const listMeta = {
  margin: 0,
  color: "#2563eb",
  fontWeight: 600,
};

const listBody = {
  margin: "10px 0 0",
  color: "#475569",
  lineHeight: 1.6,
};

const resourceCard = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
  background: "#ffffff",
  borderRadius: "18px",
  padding: "18px",
  border: "1px solid rgba(148,163,184,0.14)",
  marginBottom: "14px",
};

const resourceAccent = {
  width: "10px",
  minWidth: "10px",
  borderRadius: "999px",
  alignSelf: "stretch",
};

const resourceHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "8px",
  flexWrap: "wrap",
};

const resourceTag = {
  display: "inline-flex",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#e0e7ff",
  color: "#3730a3",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const resourceLink = {
  color: "#2563eb",
  fontWeight: 600,
  textDecoration: "none",
};

const emptyState = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "24px",
  border: "1px dashed rgba(148,163,184,0.4)",
};

const emptyTitle = {
  margin: "0 0 8px",
  color: "#0f172a",
};

const emptyText = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.6,
};

const pageLayout = {
  maxWidth: "900px",
  margin: "0 auto",
};

const pageLayoutMobile = {
  maxWidth: "100%",
};

const chatPageLayout = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const pageHeader = {
  marginBottom: "18px",
};

const workingAsText = {
  margin: "8px 0 0",
  color: "#64748b",
  fontWeight: 700,
};

const pageTitle = {
  margin: 0,
  color: "#0f172a",
};

const formCard = {
  background: "rgba(255,255,255,0.86)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  border: "1px solid rgba(148,163,184,0.16)",
  marginBottom: "22px",
};

const formHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const formTitle = {
  margin: "0 0 6px",
  color: "#0f172a",
};

const formSubtitle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.5,
};

const ghostBtn = {
  background: "#eef2ff",
  color: "#3730a3",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 600,
};

const listGrid = {
  display: "grid",
  gap: "16px",
};

const input = {
  display: "block",
  width: "100%",
  margin: "0 0 12px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  fontSize: "1rem",
};

const btn = {
  padding: "14px 18px",
  width: "100%",
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "white",
  border: "none",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: 600,
};

const box = {
  background: "rgba(255,255,255,0.86)",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  border: "1px solid rgba(148,163,184,0.16)",
};

const boxTitle = {
  margin: "0 0 8px",
  color: "#0f172a",
};

const boxMeta = {
  margin: "0 0 10px",
  color: "#2563eb",
  fontWeight: 600,
};

const boxDescription = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
};

const boxActions = {
  display: "flex",
  gap: "10px",
  marginTop: "16px",
  flexWrap: "wrap",
};

const secondaryActionBtn = {
  background: "#e0f2fe",
  color: "#075985",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerActionBtn = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: 600,
};

export default Dashboard;

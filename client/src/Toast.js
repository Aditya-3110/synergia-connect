function Toast({ toast }) {
  if (!toast) {
    return null;
  }

  const isError = toast.type === "error";

  return (
    <div style={{ ...toastBox, ...(isError ? errorToast : successToast) }}>
      <strong>{isError ? "Action needed" : "Success"}</strong>
      <span>{toast.message}</span>
    </div>
  );
}

const toastBox = {
  position: "fixed",
  right: "24px",
  bottom: "24px",
  zIndex: 1000,
  display: "grid",
  gap: "4px",
  minWidth: "260px",
  maxWidth: "360px",
  padding: "16px 18px",
  borderRadius: "18px",
  color: "white",
  boxShadow: "0 22px 50px rgba(15, 23, 42, 0.24)",
  lineHeight: 1.4,
};

const successToast = {
  background: "linear-gradient(135deg, #16a34a, #2563eb)",
};

const errorToast = {
  background: "linear-gradient(135deg, #dc2626, #f97316)",
};

export default Toast;

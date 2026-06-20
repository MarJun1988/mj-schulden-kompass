export const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("de-DE") : "-";

export const deletionStatusText = (status: string | null) => {
  if (status === "PENDING") {
    return "Löschung beantragt";
  }

  if (status === "REJECTED") {
    return "Löschung abgelehnt";
  }

  return null;
};

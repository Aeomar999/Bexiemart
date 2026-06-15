export function exportToCsv<T extends Record<string, any>>(data: T[], filename: string) {
  if (!data || !data.length) {
    return;
  }

  // Extract headers
  const headers = Object.keys(data[0]);

  // Convert to CSV string
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          let cellValue = row[header];
          
          if (cellValue === null || cellValue === undefined) {
            cellValue = "";
          } else if (typeof cellValue === "object") {
            // Handle nested objects by stringifying them or extracting a specific property like ID
            if (cellValue.id) {
              cellValue = cellValue.id;
            } else if (cellValue.name) {
              cellValue = cellValue.name;
            } else {
              cellValue = JSON.stringify(cellValue);
            }
          }
          
          // Escape quotes and wrap in quotes if there's a comma
          const stringValue = String(cellValue).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(",")
    ),
  ].join("\n");

  // Create Blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

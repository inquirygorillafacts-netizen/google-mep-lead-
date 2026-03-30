import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Lead {
  Name: string;
  Phone: string;
  Address: string;
  Rating: string | number;
  Reviews: string | number;
  EstPrice: string;
  Status: string;
  id?: string;
  commitId?: string;
  Website?: string;
  maps_url?: string;
}

export const exportToCSV = (leads: Lead[], filename = "Leads_Export") => {
  if (!leads.length) return;
  const header = Object.keys(leads[0]).join(",");
  const rows = leads.map((lead: Lead) =>
    Object.values(lead)
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csvContent = [header, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (leads: Lead[], filename = "Leads_Export") => {
  if (!leads.length) return;
  const worksheet = XLSX.utils.json_to_sheet(leads);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (leads: Lead[], filename = "Leads_Export") => {
  if (!leads.length) return;
  const doc = new jsPDF();
  doc.text("LeadGorilla - Leads Export", 14, 15);
  
  const tableColumn = Object.keys(leads[0]);
  const tableRows = leads.map(lead => Object.values(lead) as string[]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: { fontSize: 8 },
    theme: 'grid'
  });

  doc.save(`${filename}.pdf`);
};

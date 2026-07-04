import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResearchData } from '@/types';

function createPdfDoc(data: ResearchData): jsPDF {
  const doc = new jsPDF();
  const margin = 14;
  let yPos = 20;

  // Title
  doc.setFontSize(22);
  doc.text(`Company Research Report: ${data.company.name}`, margin, yPos);
  yPos += 10;

  // Company Info
  doc.setFontSize(12);
  doc.text(`Website: ${data.company.website}`, margin, yPos);
  yPos += 7;
  if (data.company.phone) {
    doc.text(`Phone: ${data.company.phone}`, margin, yPos);
    yPos += 7;
  }
  if (data.company.address) {
    doc.text(`Address: ${data.company.address}`, margin, yPos);
    yPos += 7;
  }
  
  doc.setFontSize(10);
  doc.text(`Generated at: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += 15;

  if (data.report) {
    // Summary
    doc.setFontSize(16);
    doc.text('Summary', margin, yPos);
    yPos += 7;
    doc.setFontSize(12);
    const summaryLines = doc.splitTextToSize(data.report.summary, 180);
    doc.text(summaryLines, margin, yPos);
    yPos += summaryLines.length * 6 + 10;

    // Check if new page is needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Products
    if (data.report.products && data.report.products.length > 0) {
      doc.setFontSize(16);
      doc.text('Products', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Product Name']],
        body: data.report.products.map(p => [p]),
        margin: { left: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Services
    if (data.report.services && data.report.services.length > 0) {
      doc.setFontSize(16);
      doc.text('Services', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Service Name']],
        body: data.report.services.map(s => [s]),
        margin: { left: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Pain Points
    if (data.report.pain_points && data.report.pain_points.length > 0) {
      doc.setFontSize(16);
      doc.text('Customer Pain Points', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Pain Point']],
        body: data.report.pain_points.map(p => [p]),
        margin: { left: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Competitors
    if (data.report.competitors && data.report.competitors.length > 0) {
      doc.setFontSize(16);
      doc.text('Competitors', margin, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Name', 'Website']],
        body: data.report.competitors.map(c => [c.name, c.website]),
        margin: { left: margin },
      });
    }
  }

  return doc;
}

export function generatePDF(data: ResearchData) {
  const doc = createPdfDoc(data);
  doc.save(`${data.company.name.replace(/\s+/g, '_')}_Research_Report.pdf`);
}

export function generatePDFBlob(data: ResearchData): Blob {
  const doc = createPdfDoc(data);
  return doc.output('blob');
}

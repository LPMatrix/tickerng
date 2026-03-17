"use client";

import { useState, useCallback } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  Share2,
  Printer
} from "lucide-react";
import { jsPDF } from "jspdf";

interface ReportExportProps {
  content: string;
  query: string;
  mode: string;
}

export function ReportExport({ content, query, mode }: ReportExportProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Copy report as markdown
  const handleCopyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [content]);

  // Export as PDF with proper text rendering
  const handleExportPDF = useCallback(async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header
      doc.setFillColor(13, 92, 61); // brand accent color
      doc.rect(0, 0, pageWidth, 25, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("EquiScan Report", margin, 12);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const modeText = mode === "verification" ? "Verification" : "Discovery";
      doc.text(`Mode: ${modeText} | Generated: ${new Date().toLocaleString()}`, margin, 19);
      
      // Query section
      doc.setTextColor(26, 26, 26);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Query:", margin, 32);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 107, 107);
      const queryLines = doc.splitTextToSize(query, contentWidth);
      doc.text(queryLines, margin, 37);
      
      let yPosition = 37 + (queryLines.length * 5) + 8;
      
      // Separator line
      doc.setDrawColor(232, 230, 227);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition - 4, pageWidth - margin, yPosition - 4);
      
      // Parse and render markdown content
      const lines = content.split('\n');
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(26, 26, 26);
      
      for (const line of lines) {
        // Check for page break
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin + 5;
        }
        
        const trimmedLine = line.trim();
        
        // Skip empty lines but add spacing
        if (!trimmedLine) {
          yPosition += 4;
          continue;
        }
        
        // H1: # Heading
        if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
          yPosition += 6;
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(13, 92, 61);
          const heading = trimmedLine.replace(/^#\s*/, '');
          const headingLines = doc.splitTextToSize(heading, contentWidth);
          doc.text(headingLines, margin, yPosition);
          yPosition += (headingLines.length * 6) + 4;
          doc.setTextColor(26, 26, 26);
          continue;
        }
        
        // H2: ## Heading
        if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('### ')) {
          yPosition += 4;
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(26, 26, 26);
          const heading = trimmedLine.replace(/^##\s*/, '');
          const headingLines = doc.splitTextToSize(heading, contentWidth);
          doc.text(headingLines, margin, yPosition);
          yPosition += (headingLines.length * 5) + 3;
          continue;
        }
        
        // H3: ### Heading
        if (trimmedLine.startsWith('### ')) {
          yPosition += 3;
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(107, 107, 107);
          const heading = trimmedLine.replace(/^###\s*/, '').toUpperCase();
          const headingLines = doc.splitTextToSize(heading, contentWidth);
          doc.text(headingLines, margin, yPosition);
          yPosition += (headingLines.length * 4) + 2;
          doc.setTextColor(26, 26, 26);
          continue;
        }
        
        // Horizontal rule
        if (trimmedLine === '---' || trimmedLine === '***') {
          yPosition += 3;
          doc.setDrawColor(232, 230, 227);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 6;
          continue;
        }
        
        // Regular paragraph
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Process bold text markers for display (remove **)
        let processedLine = trimmedLine
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/^-\s+/, '• ')
          .replace(/^\*\s+/, '• ')
          .replace(/^\d+\.\s+/, (match) => match);
        
        // Table row handling
        if (trimmedLine.startsWith('|')) {
          processedLine = trimmedLine
            .replace(/\|/g, '  ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Skip table separator lines
          if (trimmedLine.replace(/[|\-\s]/g, '').length === 0) {
            continue;
          }
        }
        
        const textLines = doc.splitTextToSize(processedLine, contentWidth);
        
        // Check if we need a page break
        const lineHeight = textLines.length * 4.5;
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin + 5;
        }
        
        doc.text(textLines, margin, yPosition);
        yPosition += lineHeight + 2;
      }
      
      // Footer on each page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(154, 154, 154);
        doc.text(
          `Page ${i} of ${totalPages} | EquiScan - NGX Research Tool`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }
      
      // Download
      const filename = `equiscan-report-${query.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}-${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
      setShowShareMenu(false);
    }
  }, [content, query, mode, isExporting]);

  // Print report
  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EquiScan Report - ${query}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
              font-size: 11pt;
              line-height: 1.6;
              color: #1a1a1a;
              max-width: 210mm;
              margin: 0 auto;
              padding: 15mm;
            }
            
            .header {
              background: #0d5c3d;
              color: white;
              padding: 15px 20px;
              margin: -15mm -15mm 20px -15mm;
              width: calc(100% + 30mm);
            }
            
            .logo {
              font-family: 'Fraunces', Georgia, serif;
              font-size: 20pt;
              font-weight: 600;
              margin-bottom: 5px;
            }
            
            .meta {
              font-size: 9pt;
              opacity: 0.9;
            }
            
            .query-section {
              background: #faf9f7;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-left: 3px solid #0d5c3d;
            }
            
            .query-label {
              font-size: 9pt;
              font-weight: 600;
              color: #6b6b6b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            
            .query-text {
              font-size: 12pt;
              color: #1a1a1a;
            }
            
            h1 {
              font-family: 'Fraunces', Georgia, serif;
              font-size: 18pt;
              font-weight: 600;
              color: #0d5c3d;
              margin-top: 24pt;
              margin-bottom: 12pt;
              page-break-after: avoid;
            }
            
            h2 {
              font-family: 'Fraunces', Georgia, serif;
              font-size: 14pt;
              font-weight: 600;
              margin-top: 18pt;
              margin-bottom: 8pt;
              color: #1a1a1a;
              page-break-after: avoid;
            }
            
            h3 {
              font-size: 10pt;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b6b6b;
              margin-top: 14pt;
              margin-bottom: 6pt;
              page-break-after: avoid;
            }
            
            p {
              margin-bottom: 10pt;
              text-align: left;
            }
            
            ul, ol {
              margin-bottom: 10pt;
              padding-left: 20pt;
            }
            
            li {
              margin-bottom: 4pt;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12pt;
              font-size: 10pt;
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th, td {
              text-align: left;
              padding: 8pt 6pt;
              border-bottom: 1pt solid #e8e6e3;
            }
            
            th {
              font-weight: 600;
              color: #6b6b6b;
              background-color: #faf9f7;
            }
            
            blockquote {
              border-left: 3pt solid #0d5c3d;
              padding-left: 12pt;
              margin: 12pt 0;
              color: #6b6b6b;
              font-style: italic;
            }
            
            code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              font-size: 9.5pt;
              padding: 2pt 4pt;
              background-color: #faf9f7;
              border-radius: 3pt;
              color: #0d5c3d;
            }
            
            pre {
              background-color: #faf9f7;
              padding: 10pt;
              border-radius: 6pt;
              overflow-x: auto;
              margin-bottom: 12pt;
            }
            
            pre code {
              background: none;
              padding: 0;
            }
            
            strong {
              font-weight: 600;
            }
            
            hr {
              border: none;
              border-top: 1pt solid #e8e6e3;
              margin: 16pt 0;
            }
            
            .footer {
              margin-top: 30pt;
              padding-top: 10pt;
              border-top: 1pt solid #e8e6e3;
              text-align: center;
              font-size: 8pt;
              color: #9a9a9a;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .header {
                margin: 0 0 15pt 0;
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">EquiScan</div>
            <div class="meta">
              ${mode === "verification" ? "Verification Report" : "Discovery Report"} | 
              Generated: ${new Date().toLocaleString()}
            </div>
          </div>
          
          <div class="query-section">
            <div class="query-label">Research Query</div>
            <div class="query-text">${query}</div>
          </div>
          
          <div class="content">
            ${content
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br>")
              .replace(/#{3}\s(.+)/g, "<h3>$1</h3>")
              .replace(/#{2}\s(.+)/g, "<h2>$1</h2>")
              .replace(/#{1}\s(.+)/g, "<h1>$1</h1>")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>")
              .replace(/`(.+?)`/g, "<code>$1</code>")
            }
          </div>
          
          <div class="footer">
            Generated by EquiScan — NGX Research Tool
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
    setShowShareMenu(false);
  }, [content, query, mode]);

  // Native share (mobile)
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `EquiScan Report - ${query}`,
          text: content.slice(0, 200) + "...",
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    }
    setShowShareMenu(false);
  }, [content, query]);

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="relative">
      {/* Export/Share Button */}
      <button
        type="button"
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="
          inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-strong)] 
          bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]
          transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-accent)]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]
        "
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      {/* Share Menu Dropdown */}
      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-lg animate-fade-in">
            {/* Copy Markdown */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm
                transition-colors hover:bg-[var(--color-accent)]/5
              "
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-[var(--color-mute)]" />
              )}
              <span className={copied ? "text-emerald-600" : "text-[var(--color-ink)]"}>
                {copied ? "Copied!" : "Copy as Markdown"}
              </span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm
                transition-colors hover:bg-[var(--color-accent)]/5
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isExporting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
              ) : (
                <Download className="h-4 w-4 text-[var(--color-mute)]" />
              )}
              <span className="text-[var(--color-ink)]">
                {isExporting ? "Exporting..." : "Export as PDF"}
              </span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="
                flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm
                transition-colors hover:bg-[var(--color-accent)]/5
              "
            >
              <Printer className="h-4 w-4 text-[var(--color-mute)]" />
              <span className="text-[var(--color-ink)]">Print Report</span>
            </button>

            {/* Native Share (mobile) */}
            {canNativeShare && (
              <>
                <div className="my-1.5 border-t border-[var(--color-border)]" />
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="
                    flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm
                    transition-colors hover:bg-[var(--color-accent)]/5
                  "
                >
                  <Share2 className="h-4 w-4 text-[var(--color-mute)]" />
                  <span className="text-[var(--color-ink)]">Share...</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Download, Share2 } from "lucide-react";
import { jsPDF } from "jspdf";

interface ReportExportProps {
  content: string;
  query: string;
  mode: string;
  /** When set, show "Copy share link" in the dropdown and call this when clicked. */
  reportId?: string | null;
  onCopyShareLink?: () => void | Promise<void>;
}

export function ReportExport({ content, query, mode, reportId, onCopyShareLink }: ReportExportProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

      // Query section — black for legibility
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Query:", margin, 32);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
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
      doc.setTextColor(0, 0, 0);

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
          doc.setTextColor(0, 0, 0);
          continue;
        }

        // H2: ## Heading
        if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('### ')) {
          yPosition += 4;
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
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
          doc.setTextColor(0, 0, 0);
          const heading = trimmedLine.replace(/^###\s*/, '').toUpperCase();
          const headingLines = doc.splitTextToSize(heading, contentWidth);
          doc.text(headingLines, margin, yPosition);
          yPosition += (headingLines.length * 4) + 2;
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

        // Regular paragraph — ensure black so body is always legible
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Process bold text markers for display (remove **); use ASCII for PDF font compatibility
        let processedLine = trimmedLine
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/^-\s+/, '- ')
          .replace(/^\*\s+/, '- ')
          .replace(/^\d+\.\s+/, (match) => match)
          .replace(/\u2014/g, '-')  // em dash -> hyphen so default font renders
          .replace(/\u2022/g, '-'); // bullet -> hyphen so default font renders

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
            {/* Copy share link (read-only) */}
            {reportId && onCopyShareLink && (
              <button
                type="button"
                onClick={async () => {
                  await onCopyShareLink();
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                  setShowShareMenu(false);
                }}
                className="
                  flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm
                  transition-colors hover:bg-[var(--color-accent)]/5
                "
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Share2 className="h-4 w-4 text-[var(--color-mute)]" />
                )}
                <span className={linkCopied ? "text-emerald-600" : "text-[var(--color-ink)]"}>
                  {linkCopied ? "Link copied!" : "Copy share link"}
                </span>
              </button>
            )}
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

          </div>
        </>
      )}
    </div>
  );
}

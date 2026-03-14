// PDF generator library
import PDFDocument from 'pdfkit';

/**
 * Builds a professional Weekly Project Report PDF mimicking the Kikuyu AHP style.
 * Digitized Version for BuildTrack Pro.
 */
export const buildWeeklyReportPdf = async ({
  project,
  dailyReports,
  materialDeliveries,
  equipment,
  siteInstructions,
  startDate,
  endDate,
}) => {
  return new Promise((resolve, reject) => {
    // Configure margins for readability
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    // Capture streamed PDF
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // --- Helper Functions ---
    const formatDate = (value) => {
      if (!value) return 'N/A';
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const drawLine = (y) => {
      doc.moveTo(40, y || doc.y).lineTo(555, y || doc.y).stroke().moveDown(0.2);
    };

    const sectionHeader = (letter, text) => {
      doc.fillColor('black').font('Helvetica-Bold').fontSize(14).text(`${letter}. ${text}`, { underline: true }).moveDown(0.5);
      doc.font('Helvetica').fontSize(10);
    };

    // --- 1. Cover Page ---
    doc.font('Helvetica-Bold').fontSize(16).text('REPUBLIC OF KENYA', { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).text('MINISTRY OF LANDS, PUBLIC WORKS, HOUSING AND URBAN DEVELOPMENT', { align: 'center' });
    doc.text('STATE DEPARTMENT FOR HOUSING AND URBAN DEVELOPMENT', { align: 'center' }).moveDown(1);
    
    doc.fontSize(14).text(`PROPOSED ${project.title?.toUpperCase()}`, { align: 'center' }).moveDown(0.5);
    doc.text(`PROJECT IN ${project.county?.toUpperCase()} COUNTY`, { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).text(`CONTRACT No. ${project.contractNo}`, { align: 'center' }).moveDown(1);
    
    doc.font('Helvetica-Bold').fontSize(14).text(`WEEKLY REPORT: ${formatDate(startDate)} TO ${formatDate(endDate)}`, { align: 'center', underline: true }).moveDown(2);
    
    doc.addPage();

    // --- 2. A. CONTRACT DETAILS ---
    sectionHeader('A', 'CONTRACT DETAILS');
    const tableTop = doc.y;
    const colWidths = [40, 150, 325];
    const rowHeight = 20;

    const drawRow = (item, desc, comment) => {
      const y = doc.y;
      doc.font('Helvetica').fontSize(10);
      doc.text(item, 40, y + 5, { width: colWidths[0], align: 'center' });
      doc.text(desc, 40 + colWidths[0], y + 5, { width: colWidths[1] });
      doc.text(comment || 'N/A', 40 + colWidths[0] + colWidths[1], y + 5, { width: colWidths[2] });
      doc.rect(40, y, 515, rowHeight + 5).stroke();
      doc.moveTo(40 + colWidths[0], y).lineTo(40 + colWidths[0], y + rowHeight + 5).stroke();
      doc.moveTo(40 + colWidths[0] + colWidths[1], y).lineTo(40 + colWidths[0] + colWidths[1], y + rowHeight + 5).stroke();
      doc.y = y + rowHeight + 5;
    };

    doc.font('Helvetica-Bold');
    drawRow('Item', 'Description', 'Comment');
    doc.font('Helvetica');
    drawRow('1.', 'Project Title', project.title);
    drawRow('2.', 'Contract No.', project.contractNo);
    drawRow('3.', 'County', project.county);
    drawRow('4.', 'Financier', project.financier || 'National Government of Kenya');
    drawRow('5.', 'Employer', project.employer?.name);
    drawRow('6.', 'Contractor', project.contractor);
    drawRow('7.', 'Contract Period', `${project.contractPeriod} months`);
    drawRow('8.', 'Commencement Date', formatDate(project.commencementDate));
    drawRow('9.', 'Ending Date', formatDate(project.endingDate));
    drawRow('10.', 'Time Elapsed', `${project.daysElapsed || 0} days`);
    drawRow('11.', 'Percentage of Time Lapsed', `${project.timeElapsedPercentage?.toFixed(2) || 0}%`);
    drawRow('12.', 'Percentage Progress as per certified IPC', `${project.ipcProgress || 0}%`);
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text(`DATE OF REPORT: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}`);
    
    doc.addPage();

    // --- 3. B. SCOPE OF WORKS (Daily Activities Table) ---
    sectionHeader('B', 'SCOPE OF WORKS');
    doc.text('The works to be carried out comprises of the erection and completion of the project and associated amenities.', { width: 515 }).moveDown(1);

    const swColWidths = [70, 40, 185, 80, 80, 60];
    const swHeader = ['Date', 'Blocks', 'Description', 'Equipment', 'Labour Force', 'Visitors'];
    
    const drawSwHeader = () => {
      const y = doc.y;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.rect(40, y, 515, 20).fill('#00BFFF').stroke();
      doc.fillColor('white');
      let x = 40;
      swHeader.forEach((h, i) => {
        doc.text(h, x, y + 5, { width: swColWidths[i], align: 'center' });
        x += swColWidths[i];
      });
      doc.fillColor('black');
      doc.y = y + 20;
    };

    drawSwHeader();

    dailyReports.forEach(report => {
      const startY = doc.y;
      const dateStr = formatDate(report.date);
      
      const blockActivities = {};
      report.teams.forEach(team => {
        team.activities.forEach(act => {
          const block = act.location?.block || 'Gen';
          if (!blockActivities[block]) blockActivities[block] = [];
          blockActivities[block].push(act.description);
        });
      });

      const eqStr = (report.equipmentUsed || []).map(e => e.type).join('\n');
      const labStr = (report.workforceSummary || []).map(l => `${l.role}: ${l.count}`).join('\n');
      const visStr = (report.visitors || []).map(v => v.name).join('\n');

      const blocks = Object.keys(blockActivities);
      
      blocks.forEach((block, idx) => {
        const currentY = doc.y;
        doc.font('Helvetica').fontSize(8);
        
        if (idx === 0) {
          doc.text(dateStr, 40, currentY + 5, { width: swColWidths[0], align: 'center' });
        }

        doc.text(block, 40 + swColWidths[0], currentY + 5, { width: swColWidths[1], align: 'center' });
        
        const descText = blockActivities[block].join('\n');
        doc.text(descText, 40 + swColWidths[0] + swColWidths[1], currentY + 5, { width: swColWidths[2] });
        
        if (idx === 0) {
          doc.text(eqStr, 40 + swColWidths[0] + swColWidths[1] + swColWidths[2], currentY + 5, { width: swColWidths[3], align: 'center' });
          doc.text(labStr, 40 + swColWidths[0] + swColWidths[1] + swColWidths[2] + swColWidths[3], currentY + 5, { width: swColWidths[4] });
          doc.text(visStr, 40 + swColWidths[0] + swColWidths[1] + swColWidths[2] + swColWidths[3] + swColWidths[4], currentY + 5, { width: swColWidths[5], align: 'center' });
        }

        const maxHeight = Math.max(
          doc.heightOfString(descText, { width: swColWidths[2] }) + 10,
          idx === 0 ? doc.heightOfString(labStr, { width: swColWidths[4] }) + 10 : 0,
          idx === 0 ? doc.heightOfString(eqStr, { width: swColWidths[3] }) + 10 : 0,
          20
        );
        
        doc.moveTo(40 + swColWidths[0], currentY + maxHeight).lineTo(555, currentY + maxHeight).stroke();
        doc.y = currentY + maxHeight;

        if (doc.y > 750) {
          doc.addPage();
          drawSwHeader();
        }
      });

      const endY = doc.y;
      doc.rect(40, startY, 515, endY - startY).stroke();
      let x = 40;
      swColWidths.forEach(w => {
        doc.moveTo(x + w, startY).lineTo(x + w, endY).stroke();
        x += w;
      });
    });

    doc.addPage();

    // --- 4. C. IMPLEMENTATION STATUS (BY BLOCK) ---
    sectionHeader('C', 'BREAKDOWN OF SCOPE OF WORKS AND IMPLEMENTATION STATUS');
    if (project.blocks && project.blocks.length > 0) {
        const blkCount = project.blocks.length;
        const colWidth = 515 / (blkCount + 1);
        
        const drawGridRow = (label, data, isBold = false) => {
            const y = doc.y;
            doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
            doc.text(label.toUpperCase(), 40, y + 5, { width: colWidth });
            data.forEach((val, i) => {
                doc.text(val, 40 + (i + 1) * colWidth, y + 5, { width: colWidth, align: 'center' });
            });
            doc.rect(40, y, 515, 15).stroke();
            let xPos = 40;
            for(let i=0; i <= blkCount; i++) {
                doc.moveTo(xPos + colWidth, y).lineTo(xPos + colWidth, y + 15).stroke();
                xPos += colWidth;
            }
            doc.y = y + 15;
        };

        drawGridRow('ACTIVITY', project.blocks.map(b => b.blockId), true);
        
        // Group activities across all blocks
        const allActivities = new Set();
        project.blocks.forEach(b => {
            (b.progressBreakdown || []).forEach(pb => allActivities.add(pb.activity));
        });

        if (allActivities.size > 0) {
            allActivities.forEach(act => {
                const rowData = project.blocks.map(b => {
                    const pb = (b.progressBreakdown || []).find(p => p.activity === act);
                    return pb ? `${pb.percentage}%` : '-';
                });
                drawGridRow(act, rowData);
            });
        } else {
            // Placeholder activities if none defined
            ['Substructure', 'Columns', 'Slabs', 'Walling'].forEach(act => {
                drawGridRow(act, project.blocks.map(b => `${b.currentProgress}%`));
            });
        }
    }
    doc.moveDown(2);

    // --- 5. D, E, F Sections ---
    sectionHeader('D', 'SITE INSTRUCTIONS');
    doc.text(siteInstructions?.length > 0 ? `Instructions issued for: ${[...new Set(siteInstructions.map(si => si.location))].join(', ')}` : 'No site instructions recorded.').moveDown();

    sectionHeader('E', 'INFORMATION/DRAWINGS REQUIRED');
    let infoRequired = [];
    dailyReports.forEach(r => (r.informationRequired || []).forEach(i => infoRequired.push(i.description)));
    doc.text(infoRequired.length > 0 ? infoRequired.map(i => `• ${i}`).join('\n') : 'None').moveDown();

    sectionHeader('F', 'POSSIBLE DELAYS');
    let delays = [];
    dailyReports.forEach(r => (r.possibleDelays || []).forEach(d => delays.push(d.description)));
    doc.text(delays.length > 0 ? delays.map(d => `• ${d}`).join('\n') : 'None').moveDown();

    doc.addPage();

    // --- 6. G. EQUIPMENT ON SITE ---
    sectionHeader('G', 'EQUIPMENT ON SITE');
    const eqHeader = ['S/No.', 'Type', 'Model', 'Ownership', 'Status'];
    const eqWidths = [40, 150, 100, 100, 125];

    const drawEqRow = (data, isBold = false) => {
        const y = doc.y;
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        let x = 40;
        data.forEach((txt, i) => {
            doc.text(txt, x + 5, y + 5, { width: eqWidths[i] - 10 });
            x += eqWidths[i];
        });
        doc.rect(40, y, 515, 20).stroke();
        let lineX = 40;
        eqWidths.forEach(w => {
            doc.moveTo(lineX + w, y).lineTo(lineX + w, y + 20).stroke();
            lineX += w;
        });
        doc.y = y + 20;
    };

    drawEqRow(eqHeader, true);
    equipment.forEach((e, i) => {
        drawEqRow([`${i + 1}`, e.name, e.model || 'N/A', e.ownershipType || 'Owned', e.status]);
    });
    doc.moveDown(2);

    // --- 7. A. PROGRESS PHOTOS ---
    doc.addPage();
    sectionHeader('A', 'PROGRESS PHOTOS');
    
    // Group photos from daily reports by block
    const blockPhotos = {};
    dailyReports.forEach(report => {
        report.teams.forEach(team => {
            team.activities.forEach(act => {
                const block = act.location?.block || 'Other';
                if (act.photos && act.photos.length > 0) {
                    if (!blockPhotos[block]) blockPhotos[block] = [];
                    act.photos.forEach(p => {
                        blockPhotos[block].push({
                            url: p.url,
                            caption: `${block} ${act.location?.floor || ''} ${act.description}`.trim()
                        });
                    });
                }
            });
        });
    });

    const blocksToDisplay = project.blocks.map(b => b.blockId);
    
    blocksToDisplay.forEach(blockId => {
        doc.font('Helvetica-Bold').fontSize(12).text(`Block ${blockId}`).moveDown(0.5);
        if (blockPhotos[blockId] && blockPhotos[blockId].length > 0) {
            // Render first 2 photos per block as a sample
            blockPhotos[blockId].slice(0, 2).forEach(photo => {
                doc.fontSize(10).font('Helvetica-Oblique').text(photo.caption, { align: 'center' }).moveDown(0.5);
                // In a real env, we'd use doc.image(photo.url), but for now we placeholder:
                doc.rect(100, doc.y, 400, 200).stroke();
                doc.fontSize(8).text(`[PHOTO PLACEHOLDER: ${photo.url}]`, 100, doc.y + 90, { width: 400, align: 'center' });
                doc.y += 210;
                
                if (doc.y > 700) doc.addPage();
            });
        } else {
            doc.font('Helvetica').fontSize(10).text('No photos captured for this block during this period.').moveDown(1);
        }
        drawLine();
        doc.moveDown(1);
    });

    // --- Finalize ---
    doc.end();
  });
};

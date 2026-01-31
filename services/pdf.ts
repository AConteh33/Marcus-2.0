import type { Note, Appointment, CalendarEvent, Language } from '../types';
import { translations } from '../constants';

declare const jspdf: any;
declare const html2canvas: any;

interface PdfData {
    notes: Note[];
    appointments: Appointment[];
    calendarEvents: CalendarEvent[];
    lang: Language;
}

const escapeHtml = (unsafe: string): string => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export const generatePdf = async ({ notes, appointments, calendarEvents, lang }: PdfData) => {
    const t = translations[lang];

    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = '800px';
    pdfContainer.style.padding = '40px';
    pdfContainer.style.fontFamily = 'Helvetica, Arial, sans-serif';
    pdfContainer.style.color = '#333';
    pdfContainer.style.backgroundColor = '#fff';

    let content = `<div dir="${lang === 'ar' ? 'rtl' : 'ltr'}" style="font-family: sans-serif; text-align: ${lang === 'ar' ? 'right' : 'left'};"><h1>${t.pdfTitle}</h1><hr style="margin: 20px 0;" />`;
    
    content += `<h2>${t.notes}</h2>`;
    if (notes.length > 0) {
        notes.forEach(note => {
            content += `<div style="margin-bottom: 20px; border-left: 3px solid #f59e0b; padding-left: 15px; border-right: ${lang === 'ar' ? '3px solid #f59e0b' : 'none'}; border-left: ${lang === 'ar' ? 'none' : '3px solid #f59e0b'}; padding-right: ${lang === 'ar' ? '15px' : '0'}; padding-left: ${lang === 'ar' ? '0' : '15px'};"><h3 style="font-size: 1.1em; font-weight: bold; margin: 0 0 5px 0;">${escapeHtml(note.title)}</h3><p style="margin: 0; white-space: pre-wrap;">${escapeHtml(note.content)}</p></div>`;
        });
    } else {
        content += `<p>${t.noNotes}</p>`;
    }
    content += `<hr style="margin: 20px 0;" />`;

    content += `<h2>${t.appointments}</h2>`;
    if (appointments.length > 0) {
        appointments.forEach(appt => {
            content += `<div style="margin-bottom: 20px; border-left: 3px solid #3b82f6; padding-left: 15px; border-right: ${lang === 'ar' ? '3px solid #3b82f6' : 'none'}; border-left: ${lang === 'ar' ? 'none' : '3px solid #3b82f6'}; padding-right: ${lang === 'ar' ? '15px' : '0'}; padding-left: ${lang === 'ar' ? '0' : '15px'};"><h3 style="font-size: 1.1em; font-weight: bold; margin: 0 0 5px 0;">${escapeHtml(appt.title)}</h3><p style="margin: 0;">${escapeHtml(appt.date)} at ${escapeHtml(appt.time)}</p></div>`;
        });
    } else {
        content += `<p>${t.noAppointments}</p>`;
    }
    content += `<hr style="margin: 20px 0;" />`;

    content += `<h2>${t.calendarEvents}</h2>`;
    if (calendarEvents.length > 0) {
        calendarEvents.forEach(event => {
            content += `<div style="margin-bottom: 20px; border-left: 3px solid #10b981; padding-left: 15px; border-right: ${lang === 'ar' ? '3px solid #10b981' : 'none'}; border-left: ${lang === 'ar' ? 'none' : '3px solid #10b981'}; padding-right: ${lang === 'ar' ? '15px' : '0'}; padding-left: ${lang === 'ar' ? '0' : '15px'};"><h3 style="font-size: 1.1em; font-weight: bold; margin: 0 0 5px 0;">${escapeHtml(event.title)}</h3><p style="margin: 0;">${escapeHtml(event.date)} at ${escapeHtml(event.time)}</p></div>`;
        });
    } else {
        content += `<p>${t.noEvents}</p>`;
    }
    content += `</div>`;

    pdfContainer.innerHTML = content;
    document.body.appendChild(pdfContainer);

    try {
        const canvas = await html2canvas(pdfContainer, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save('deratak-assistant-data.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF.");
    } finally {
        document.body.removeChild(pdfContainer);
    }
};
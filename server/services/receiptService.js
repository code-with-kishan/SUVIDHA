import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const receiptDir = path.resolve('uploads/receipts');
if (!fs.existsSync(receiptDir)) {
  fs.mkdirSync(receiptDir, { recursive: true });
}

export const generateReceiptFile = async ({ payment, user }) => {
  const fileName = `receipt-${payment.id}-${Date.now()}.pdf`;
  const filePath = path.join(receiptDir, fileName);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.fontSize(20).text('SUVIDHA PAYMENT RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Date: ${new Date().toISOString()}`);
    doc.text(`Citizen: ${user.name || 'Citizen'}`);
    doc.text(`Mobile: ${user.mobile}`);
    doc.text(`Service: ${payment.serviceType}`);
    doc.text(`Amount: ${payment.amount}`);
    doc.text(`Transaction ID: ${payment.transactionId || 'N/A'}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown();
    doc.text('Thank you for using SUVIDHA.', { align: 'center' });
    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return `/uploads/receipts/${fileName}`;
};
